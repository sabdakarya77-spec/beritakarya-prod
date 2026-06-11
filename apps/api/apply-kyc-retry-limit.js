const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'kyc', 'kyc.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the user select query
content = content.replace(
  `const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    })`,
  `const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, kycAttempts, kycLockedUntil }
    })`
);

// Insert lock check and reset logic after the isVerified check
const insertPoint = `if (user?.isVerified) {
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(400).json({ success: false, error: { message: 'KYC sudah disetujui' } })
    }

    // 3. Process and Save`;

const replacement = `if (user?.isVerified) {
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(400).json({ success: false, error: { message: 'KYC sudah disetujui' } })
    }

    // 2b. Check if account is locked due to too many failed attempts
    const now = new Date()
    if (user?.kycLockedUntil && user.kycLockedUntil > now) {
      const remainingHours = Math.ceil((user.kycLockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60))
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(403).json({
        success: false,
        error: {
          message: \`Akun Anda dikunci sementara karena terlalu banyak percobaan KYC. Coba lagi dalam \${remainingHours} jam.\`
        }
      })
    }

    // 2c. Reset attempts if lock expired or no lock exists
    if (user?.kycLockedUntil && user.kycLockedUntil <= now) {
      await prisma.user.update({
        where: { id: userId },
        data: { kycAttempts: 0, kycLockedUntil: null }
      })
    }

    // 3. Process and Save`;

content = content.replace(insertPoint, replacement);

// Fix the duplicated catch block - replace the try-catch structure
const oldTryCatch = `    // 3. Process and Save
    try {
      const idCardResult = await WatermarkService.savePermanent(idCard.path, userId, 'ktp')
      const familyCardResult = familyCard 
        ? await WatermarkService.savePermanent(familyCard.path, userId, 'kk')
        : null

      // --- CLOUD STORAGE UPLOAD (S3/R2) ---
      let idPath = idCardResult.original
      let familyPath = familyCardResult?.original

      const isCloudEnabled = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'r2'

      if (isCloudEnabled) {
        try {
          const idKey = \`kyc/\${userId}/ktp_\${Date.now()}.jpg\`
          await StorageService.uploadFile(idCardResult.original, idKey, 'image/jpeg')
          idPath = idKey
          
          // Cleanup local
          await fs.unlink(idCardResult.original).catch(() => {})
          await fs.unlink(idCardResult.thumbnail).catch(() => {})

          if (familyCardResult) {
            const familyKey = \`kyc/\${userId}/kk_\${Date.now()}.jpg\`
            await StorageService.uploadFile(familyCardResult.original, familyKey, 'image/jpeg')
            familyPath = familyKey
            
            // Cleanup local
            await fs.unlink(familyCardResult.original).catch(() => {})
            await fs.unlink(familyCardResult.thumbnail).catch(() => {})
          }
        } catch (err) {
          logger.error(\`Cloud Upload failed: \${err}\`)
          return res.status(500).json({ success: false, error: { message: 'Gagal mengunggah ke penyimpanan awan (R2)' } })
        }
      }
      // --- CLOUD STORAGE END ---

      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: {
            bio: req.body.bio,
            idCardPath: idPath,
            familyCardPath: familyPath || null,
            kycSubmittedAt: new Date(),
            kycConsentGivenAt: new Date(),
            kycDataExpiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
            isVerified: false,
            kycNotes: \`SUBMITTED at \${new Date().toISOString()}\`
          }
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            userId,
            siteId,
            action: 'kyc.submit',
            entityType: 'user',
            entityId: userId,
            newValue: { hasIdCard: true, hasFamilyCard: !!familyCard }
          }
        })

        return u
      })

      // 4. Notify Admins
      const admins = await prisma.user.findMany({
        where: {
          siteId,
          role: { in: ['superadmin', 'wapimred'] }
        },
        select: { id: true }
      })

      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          siteId,
          type: 'kyc_submitted',
          title: '📝 Pengajuan KYC Baru',
          message: \`User \${updatedUser.name} telah mengajukan verifikasi identitas.\`,
          link: \`/dashboard/admin/kyc/\${userId}\`
        })
      }

      res.status(200).json({ success: true, data: { message: 'KYC submitted successfully' } })
    } catch (error: any) {
      logger.error('KYC submission failed:', error)
      res.status(500).json({ success: false, error: { message: 'Gagal memproses pengajuan KYC' } })
    })`;

const newTryCatch = `    // 3. Process and Save
    try {
      const idCardResult = await WatermarkService.savePermanent(idCard.path, userId, 'ktp')
      const familyCardResult = familyCard 
        ? await WatermarkService.savePermanent(familyCard.path, userId, 'kk')
        : null

      // --- CLOUD STORAGE UPLOAD (S3/R2) ---
      let idPath = idCardResult.original
      let familyPath = familyCardResult?.original

      const isCloudEnabled = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'r2'

      if (isCloudEnabled) {
        try {
          const idKey = \`kyc/\${userId}/ktp_\${Date.now()}.jpg\`
          await StorageService.uploadFile(idCardResult.original, idKey, 'image/jpeg')
          idPath = idKey
          
          // Cleanup local
          await fs.unlink(idCardResult.original).catch(() => {})
          await fs.unlink(idCardResult.thumbnail).catch(() => {})

          if (familyCardResult) {
            const familyKey = \`kyc/\${userId}/kk_\${Date.now()}.jpg\`
            await StorageService.uploadFile(familyCardResult.original, familyKey, 'image/jpeg')
            familyPath = familyKey
            
            // Cleanup local
            await fs.unlink(familyCardResult.original).catch(() => {})
            await fs.unlink(familyCardResult.thumbnail).catch(() => {})
          }
        } catch (err) {
          logger.error(\`Cloud Upload failed: \${err}\`)
          return res.status(500).json({ success: false, error: { message: 'Gagal mengunggah ke penyimpanan awan (R2)' } })
        }
      }
      // --- CLOUD STORAGE END ---

      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: {
            bio: req.body.bio,
            idCardPath: idPath,
            familyCardPath: familyPath || null,
            kycSubmittedAt: new Date(),
            kycConsentGivenAt: new Date(),
            kycDataExpiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
            isVerified: false,
            kycNotes: \`SUBMITTED at \${new Date().toISOString()}\`
          }
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            userId,
            siteId,
            action: 'kyc.submit',
            entityType: 'user',
            entityId: userId,
            newValue: { hasIdCard: true, hasFamilyCard: !!familyCard }
          }
        })

        return u
      })

      // 4. Notify Admins
      const admins = await prisma.user.findMany({
        where: {
          siteId,
          role: { in: ['superadmin', 'wapimred'] }
        },
        select: { id: true }
      })

      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          siteId,
          type: 'kyc_submitted',
          title: '📝 Pengajuan KYC Baru',
          message: \`User \${updatedUser.name} telah mengajukan verifikasi identitas.\`,
          link: \`/dashboard/admin/kyc/\${userId}\`
        })
      }

      res.status(200).json({ success: true, data: { message: 'KYC submitted successfully' } })
    } catch (error: any) {
      // Increment failed attempts on any error during processing
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycAttempts: { increment: 1 },
          ...(user.kycAttempts + 1 >= 3 ? { kycLockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } : {}) // Lock for 24 hours after 3 attempts
        }
      })
      logger.error('KYC submission failed:', error)
      res.status(500).json({ success: false, error: { message: 'Gagal memproses pengajuan KYC' } })
    })`;

content = content.replace(oldTryCatch, newTryCatch);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ KYC retry limit logic applied successfully');
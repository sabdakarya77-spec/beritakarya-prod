const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'kyc', 'kyc.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add email service import at the top
const importLine = `import { sendNotification } from '../notification/notification.controller'`;
if (!content.includes('emailService')) {
  content = content.replace(
    importLine,
    `${importLine}\nimport { emailService } from '../../services/email.service'`
  );
}

// Find the KYC approval/reject notification section and add email
const notificationSection = `      // Notify User
      await sendNotification({
        userId,
        siteId: targetUser.siteId!,
        type: isApproved ? 'kyc_approved' : 'kyc_rejected',
        title: isApproved ? '✅ KYC Disetujui' : '❌ KYC Ditolak',
        message: isApproved 
          ? 'Selamat! Verifikasi identitas Anda telah disetujui. Anda sekarang dapat menerbitkan berita.'
          : \`Verifikasi identitas Anda ditolak. Alasan: \${notes || 'Tidak memenuhi syarat'}.\`,
        link: '/dashboard/settings'
      })`;

const newNotificationSection = `      // Notify User via in-app notification
      await sendNotification({
        userId,
        siteId: targetUser.siteId!,
        type: isApproved ? 'kyc_approved' : 'kyc_rejected',
        title: isApproved ? '✅ KYC Disetujui' : '❌ KYC Ditolak',
        message: isApproved 
          ? 'Selamat! Verifikasi identitas Anda telah disetujui. Anda sekarang dapat menerbitkan berita.'
          : \`Verifikasi identitas Anda ditolak. Alasan: \${notes || 'Tidak memenuhi syarat'}.\`,
        link: '/dashboard/settings'
      })

      // Also send email notification if email service is enabled
      const targetUserEmail = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })

      if (targetUserEmail) {
        await emailService.sendKYCNotification(
          targetUserEmail.email,
          targetUserEmail.name,
          isApproved ? 'approved' : 'rejected',
          isApproved ? undefined : notes || 'Tidak memenuhi syarat'
        ).catch(err => {
          logger.error('Failed to send KYC email notification:', err)
          // Don't fail the transaction if email fails
        })
      }`;

content = content.replace(notificationSection, newNotificationSection);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Email notifications integrated into KYC controller');
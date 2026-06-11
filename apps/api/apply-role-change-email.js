const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'user', 'user.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add email service import at the top if not already present
if (!content.includes('emailService')) {
  content = content.replace(
    `import { asyncHandler } from '../../utils/asyncHandler'`,
    `import { asyncHandler } from '../../utils/asyncHandler'\nimport { emailService } from '../../services/email.service'`
  );
}

// Find the section after audit log and before res.json, add email notification
const searchPattern = `    // Audit log for role change
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        siteId: req.site!,
        action: 'user.role_change',
        entityType: 'user',
        entityId: id,
        oldValue: { role: oldRole },
        newValue: { role: role }
      }
    })

    // TODO: Send email notification to user about role change (when email service is ready)

    res.json({ success: true, data: updated })`;

const replacement = `    // Audit log for role change
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        siteId: req.site!,
        action: 'user.role_change',
        entityType: 'user',
        entityId: id,
        oldValue: { role: oldRole },
        newValue: { role: role }
      }
    })

    // Send email notification to user about role change
    const userEmail = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true }
    })

    if (userEmail) {
      await emailService.sendRoleChangeNotification(
        userEmail.email,
        userEmail.name,
        oldRole,
        role,
        req.user!.name || 'Administrator'
      ).catch(err => {
        logger.error('Failed to send role change email notification:', err)
        // Don't fail the request if email fails
      })
    }

    res.json({ success: true, data: updated })`;

content = content.replace(searchPattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Role change email notifications integrated into user controller');
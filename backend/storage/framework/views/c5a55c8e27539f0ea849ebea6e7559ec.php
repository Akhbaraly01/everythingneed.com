<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate <?php echo e($certificate->certificate_number); ?></title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 60px 40px; color: #1f2937; }
  .card { border: 6px double #4f46e5; padding: 48px 32px; max-width: 640px; margin: 0 auto; }
  h1 { font-size: 30px; margin: 0 0 8px; }
  .name { font-size: 24px; font-weight: bold; margin: 16px 0 4px; }
  .meta { font-size: 14px; color: #4b5563; margin-top: 12px; }
  .code { font-family: monospace; font-size: 13px; margin-top: 20px; }
</style>
</head>
<body>
<div class="card">
  <h1>Certificate of Completion</h1>
  <p>This certifies that</p>
  <p class="name"><?php echo e($certificate->user?->name ?? 'Learner'); ?></p>
  <p>has successfully completed</p>
  <p class="name"><?php echo e($certificate->course_title); ?></p>
  <?php if($certificate->instructor_name): ?>
  <p>Instructor: <?php echo e($certificate->instructor_name); ?></p>
  <?php endif; ?>
  <p class="meta">Issued <?php echo e($certificate->issued_at?->format('F j, Y') ?? ''); ?> · EverythingNeed Learning</p>
  <p class="code"><?php echo e($certificate->certificate_number); ?></p>
</div>
</body>
</html>
<?php /**PATH C:\Users\Lenovo\Desktop\EVERYTHINGNEED\MY PROJECT\everythingneed-com\backend\resources\views/certificates/download.blade.php ENDPATH**/ ?>
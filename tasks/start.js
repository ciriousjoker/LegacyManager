const childProcess = require('child_process');
const electron = require('electron');
const gulp = require('gulp');

gulp.task('start', ['build', 'watch'], () => {
  childProcess.spawn(electron, ['.', '--force-gpu-rasterization'], { stdio: 'inherit' })
  .on('close', () => {
    // User closed the app. Kill the host process.
    process.exit();
  })
  .on('error', spawnError => console.error(spawnError));
});

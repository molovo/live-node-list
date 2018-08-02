import gulp from 'gulp'
import browserify from 'browserify'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import uglifyEs from 'uglify-es'
import composer from 'gulp-uglify/composer'
import clone from 'gulp-clone'
import rename from 'gulp-rename'

const uglify = composer(uglifyEs, console)

gulp.task('build', () => {
  const sink = clone.sink()

  return browserify('src/index.js')
    .transform('babelify')
    .bundle()
    .pipe(source('live-node-list.js'))
    .pipe(buffer())
    .pipe(sink)
    .pipe(uglify())
    .pipe(rename('live-node-list.min.js'))
    .pipe(sink.tap())
    .pipe(gulp.dest('dist/'))
})

gulp.task('watch', () => {
  gulp.watch('src/**/*', ['build', 'build-example'])
})


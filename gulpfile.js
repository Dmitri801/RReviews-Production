const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass");
const useref = require("gulp-useref");
const uglify = require("gulp-uglify-es").default;
const gulpIf = require("gulp-if");

// Compile Sass
gulp.task("sass", () => {
  return gulp
    .src(["src/scss/*.scss"])
    .pipe(sass())
    .pipe(gulp.dest("src/css"))
    .pipe(browserSync.stream({ match: "**/*.css" }));
});

// Watch and Serve
gulp.task("serve", ["sass"], () => {
  browserSync.init({
    injectChanges: true,
    server: "./src"
  });

  gulp.watch(["src/scss/*.scss"], ["sass"]).on("change", browserSync.reload);
  gulp.watch(["src/*.html"]).on("change", browserSync.reload);
  gulp.watch(["src/*.js", "src/sw/*.js"]).on("change", browserSync.reload);
});

// Minify javascript/css
gulp.task("useref", () => {
  return (
    gulp
      .src("dist/*.html")
      .pipe(useref())
      // Minifies if its a javascript file
      .pipe(gulpIf("dist/js/*.js", uglify()))
      .pipe(gulp.dest("dist"))
  );
});

// Task that excludes browserSync
gulp.task("audit", ["sass"], () => {});

// Default task
gulp.task("default", ["serve"]);

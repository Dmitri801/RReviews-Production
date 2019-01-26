/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: "im",
          sizes: [
            {
              name: "small",
              width: 320,
              height: 240
            },
            {
              name: "medium",
              width: 1600,
              height: 1200,
              quality: 30
            },
            {
              name: "large",
              width: 1024,
              separator: "-",
              suffix: "_x2",
              quality: 0.6
            }
          ]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [
          {
            expand: true,
            src: ["*.{gif,jpg,png}"],
            cwd: "img/",
            dest: "images/"
          }
        ]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ["images"]
      }
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ["images"]
        }
      }
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */

    imagemin: {
      dynamic: {
        files: [
          {
            expand: true,
            cwd: "public/images_src/",
            src: ["**/*.{png,jpg,gif}"],
            dest: "images/"
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks("grunt-responsive-images");
  grunt.loadNpmTasks("grunt-contrib-imagemin");
  grunt.loadNpmTasks("grunt-contrib-clean");

  grunt.loadNpmTasks("grunt-mkdir");
  grunt.registerTask("default", [
    "clean",
    "mkdir",

    "responsive_images",
    "imagemin"
  ]);
};

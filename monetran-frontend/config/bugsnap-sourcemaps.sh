#!/bin/sh

    #--minified-url 'https://monetran.herokuapp.com/static/js/1.40177d35.chunk.js' \
bugsnag-sourcemaps upload --api-key b5d0821f4251f474516c7e9b1bf3a2a6 \
    --app-version 1.0.0 \
    --minified-url 'http://localhost:57139/static/js/1.40177d35.chunk.js' \
    --source-map /Users/codehakase/Dev/PROJECTS/Monetran/monetran-frontend/build/static/js/1.40177d35.chunk.js.map \
    --minified-file /Users/codehakase/Dev/PROJECTS/Monetran/monetran-frontend/build/static/js/1.40177d35.chunk.js
# burn-project

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## TODO:

* Add image editing on upload
* Add User avatars to all created by fields.
* In "New Exercise", on "Add Set" button, auto focus to the new reps count.
* Auto push .catch error messages to the database for error tracking later on.
* User profile work with both username and user ID
* MarkdownInput.vue add so highlighting over text and pressing bold/italics will add 2 stars before and 2 after selected text.
* Look at distributed counters for Likes count: [Docs](https://firebase.google.com/docs/firestore/solutions/counters#web) [Tutorial](https://fireship.io/lessons/firestore-cloud-functions-data-aggregation/)
* Add a 5 most recent comments array onto the parent of Exercises/Workouts etc
* Images on exercises have no order. Fix that.
* Add graphs to user's profile for recent workouts.
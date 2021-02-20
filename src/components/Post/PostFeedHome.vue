<!--
    This component is a hacky way to load in data.
    We can't do this in Home, as this component needs to be launched first
    so we can load in the post data.
-->
<template>
    <PostFeed v-if="!isLoading" @addPost="addPost" :posts="posts" :newPost="true"></PostFeed>
    <div v-else>
        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </div>
</template>

<script>
import { functions } from '@/firebase'

import PostFeed from '@/components/Post/PostFeed.vue'

export default {
    name: 'PostFeedHome',
    components: { PostFeed },
    data() {
        return {
            isLoading: true,
            posts: [],
        }
    },

    created: function() {
        let buildFeedFunction = functions.httpsCallable("buildFeed");

        buildFeedFunction().then(result => {
            this.posts = result.data.posts;
            console.log(this.posts);
            this.isLoading = false;
        }).catch(e => {
            console.error("Failure", e);
            this.isLoading = false;
        })
    },

    methods: {
        addPost: function(id) {
            this.posts.unshift(id);
        }
    }
}
</script>
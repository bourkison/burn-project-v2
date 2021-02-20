<template>
    <div v-if="!isLoading">
        <h1>Welcome, {{$store.state.userProfile.docData.username}}</h1>
        <PostNew style="margin: 20px 0;" @newPost="newPost" />
        <v-row v-for="post in posts" :key="post">
            <v-col cols="12" sm="12">
                <PostComponent :postId="post"></PostComponent>
            </v-col>
        </v-row>
    </div>
    <div v-else>
        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </div>
</template>

<script>
import { functions } from '@/firebase'

import PostNew from '@/components/Post/PostNew.vue'
import PostComponent from '@/components/Post/PostComponent.vue'

export default {
    name: 'Feed',
    components: { PostNew, PostComponent },
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
            this.isLoading = false;
        }).catch(e => {
            console.error("Failure", e);
            this.isLoading = false;
        })
    },

    methods: {
        newPost: function(p) {
            this.posts.unshift(p.id);
        }
    }
}
</script>
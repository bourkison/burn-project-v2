<template>
    <div class="postFeed">
        <PostNew style="margin: 20px 0;" @newPost="addPost" v-if="newPost" />
        <v-row v-for="post in posts" :key="post">
            <v-col cols="12" sm="12">
                <PostComponent :postId="post"></PostComponent>
            </v-col>
        </v-row>
    </div>
</template>

<script>
import PostNew from '@/components/Post/PostNew.vue'
import PostComponent from '@/components/Post/PostComponent.vue'

export default {
    name: 'Feed',
    components: { PostNew, PostComponent },
    props: {
        posts: {
            type: Array,
            required: true
        },
        newPost: {
            type: Boolean,
            required: true
        }
    },

    methods: {
        addPost: function(p) {
            this.$emit("addPost", p.id);
        }
    }
}
</script>
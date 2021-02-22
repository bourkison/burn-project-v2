<template>
    <v-container class="mainCont" fluid>
        <v-row>
            <v-spacer />
            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268">

                </v-sheet>
            </v-col>

            <v-col cols="12" sm="6" lg="5" xl="4">
                <v-sheet rounded="lg">
                    <PostComponent :postId="postId" />
                </v-sheet>
            </v-col>

            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268">

                </v-sheet>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import PostComponent from '@/components/Post/PostComponent.vue'

export default {
    name: 'PostView',
    components: { PostComponent },
    data() {
        return {
            postId: ''
        }
    },

    mounted: function() {
        console.log(this.$route.params.postid);
        this.postId = this.$route.params.postid;
        console.log("postId", this.postId)
    }
}
</script>
<template>
    <v-card v-if="!isLoading" outlined>
        <v-carousel height="auto" v-model="carouselModel" show-arrows-on-hover hide-delimiter-background>
            <v-carousel-item class="carouselImage" v-for="img in imgUrls" :key="img.order" eager>
                <v-img :src="img.imgUrl" eager/>
            </v-carousel-item>
        </v-carousel>
        <v-container>
            <v-container>
                <div>{{ postData.content }}</div>
            </v-container>
            <div align="left" style="margin: 0 -10px;">
                <CommentSection
                    :post-id="postId"
                    :is-liked="isLiked"
                    :like-count="postData.likeCount"
                    :recentComments="postData.recentComments"
                    :commentCount="postData.commentCount"
                    :followableComponent="false"
                    @likeToggle="likeToggle"
                ></CommentSection>
            </div>
        </v-container>
    </v-card>
    <v-card v-else outlined min-height="200">
        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </v-card>
</template>

<script>
import { db, storage } from '../../firebase'

import CommentSection from '../Comments/CommentSection.vue'

export default {
    name: 'ViewPostMin',
    components: { CommentSection },
    props: {
        postId: {
            type: String,
            required: true
        }
    },

    data() {
        return {
            isLoading: true,
            postData: {},
            imgUrls: [],
            isLiked: '',

            // Firebase:
            downloadedImageCounter: 0,

            // Vuetify:
            carouselModel: 0
        }
    },

    mounted: function() {
        db.collection("posts").doc(this.$props.postId).get().then(postDoc => {
            this.postData = postDoc.data();

            if (this.postData.imgPaths.length > 0) {
                let i = 0;
                this.postData.imgPaths.forEach(imgPath => {
                    this.downloadImage(imgPath, i);
                    i ++;
                })
            } else {
                this.isLoading = false;
            }
        })
    },

    methods: {
        downloadImage: function(ref, order) {
            storage.ref(ref).getDownloadURL().then(url => {
                this.imgUrls.push({ order: order, imgUrl: url });
                this.downloadedImageCounter ++;
            })
        },

        likeToggle: function(s) {
            if (s === '') {
                this.postData.likeCount --;
            } else {
                this.postData.likeCount ++;
            }

            this.isLiked = s;
        }
    },

    watch: {
        downloadedImageCounter: function() {
            if (this.downloadedImageCounter >= this.postData.imgPaths.length) {
                this.imgUrls.sort((a, b) => a.order - b.order);

                // Images are now downloaded. Check if user has liked this post.
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.postId).get().then(likeSnapshot => {
                    likeSnapshot.forEach(like => {
                        if (like.exists) {
                            this.isLiked = like.id;
                        }
                    })

                    this.isLoading = false;
                })
            }
        }
    }
}
</script>
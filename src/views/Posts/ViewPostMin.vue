<template>
    <v-card v-if="!isLoading" outlined>
        <v-container>
            <v-row style="align-items:center">
                <v-col cols="12" sm="1">
                    <v-avatar size="32"><v-img :src="postData.createdBy.profilePhoto"></v-img></v-avatar>
                </v-col>
                <v-col cols="12" sm="11">
                    <router-link :to="'/' + postData.createdBy.username"><b>{{ postData.createdBy.username }}</b></router-link>
                    <span v-if="postData.exercise"> shared an <router-link :to="'/exercises/' + postData.exercise.id">exercise</router-link></span>
                    <span v-if="postData.workout"> shared a <router-link :to="'/workouts/' + postData.workout.id">workout</router-link></span>
                </v-col>
            </v-row>
        </v-container>
        <v-carousel v-if="imgUrls.length > 0" height="auto" v-model="carouselModel" show-arrows-on-hover hide-delimiter-background>
            <v-carousel-item class="carouselImage" v-for="(img, index) in imgUrls" :key="index" eager>
                <v-img :src="img" eager/>
            </v-carousel-item>
        </v-carousel>
        <v-container>
            <v-container style="padding:0 40px;" v-if="postData.exercise">
                <v-expansion-panels>
                    <ExerciseExpandable :exerciseToDownload="postData.exercise"></ExerciseExpandable>
                </v-expansion-panels>
            </v-container>
            <v-container style="padding: 0 40px 5px;" v-if="postData.workout">
                <WorkoutExpandable :workout="postData.workout"></WorkoutExpandable>
            </v-container>
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
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable'
import WorkoutExpandable from '@/components/Workout/WorkoutExpandable'

export default {
    name: 'ViewPostMin',
    components: { CommentSection, ExerciseExpandable, WorkoutExpandable },
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
                let imageDownloadPromises = [];
                
                this.postData.imgPaths.forEach(imgPath => {
                    imageDownloadPromises.push(storage.ref(imgPath).getDownloadURL());
                })

                Promise.all(imageDownloadPromises).then(imgUrls => {
                    imgUrls.forEach(url => {
                        this.imgUrls.push(url);
                    })
                    
                    this.checkIfLiked().then(() => {
                        this.isLoading = false;
                    })
                })

            } else {
                this.checkIfLiked().then(() => {
                    this.isLoading = false;
                })
            }
        })
    },

    methods: {
        likeToggle: function(s) {
            if (s === '') {
                this.postData.likeCount --;
            } else {
                this.postData.likeCount ++;
            }

            this.isLiked = s;
        },

        checkIfLiked: function() {
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.postId).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            })
        }
    }
}
</script>
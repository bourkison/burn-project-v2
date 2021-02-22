<template>
    <v-card v-if="!isLoading" outlined>
        <v-container>
            <v-row style="align-items:center">
                <v-col cols="12" sm="1">
                    <v-avatar size="32"><v-img :src="postData.createdBy.profilePhoto"></v-img></v-avatar>
                </v-col>
                <v-col cols="12" sm="11">
                    <v-row justify="center" align="center" style="padding:10px">
                        <div>
                            <router-link :to="'/' + postData.createdBy.username"><b>{{ postData.createdBy.username }}</b></router-link>&nbsp;
                            <span v-if="postData.share.type == 'exercises'">&nbsp;shared an <router-link :to="'/exercises/' + postData.exercise.id">exercise</router-link></span>
                            <span v-if="postData.share.type == 'workouts'">&nbsp;shared a <router-link :to="'/workouts/' + postData.workout.id">workout</router-link></span>
                            <span v-if="postData.share.type == 'burns'">&nbsp;shared a recent burn</span>
                        </div>
                        <v-spacer/>
                        <span style="font-size:12px;"><em>{{ createdAtText }}</em></span>
                    </v-row>
                </v-col>
            </v-row>
        </v-container>
        <div v-if="imgUrls.length > 1">
            <v-carousel v-if="imgUrls.length > 0" height="auto" v-model="carouselModel" show-arrows-on-hover hide-delimiter-background>
                    <v-carousel-item class="carouselImage" v-for="(img, index) in imgUrls" :key="index" eager>
                        <v-img :src="img" eager/>
                    </v-carousel-item>
            </v-carousel>
        </div>
        <div v-else-if="imgUrls.length > 0">
            <v-img :src="imgUrls[0]" eager />
        </div>
        <v-container>
            <v-container style="padding:0 40px;" v-if="postData.share && postData.share.type == 'exercises'">
                <!-- <v-expansion-panels>
                    <ExerciseExpandable :exerciseToDownload="postData.share" />
                </v-expansion-panels> -->
                <ExerciseShare :exerciseId="postData.share.id" />
            </v-container>
            <v-container style="padding: 0 40px 5px;" v-if="postData.share && postData.share.type == 'workouts'">
                <WorkoutExpandable :workout="postData.workout" />
            </v-container>
            <v-container style="padding:0 20px;" v-if="postData.share && postData.share.type === 'burns'">
                <BurnShare :burnId="postData.share.id" :userId="postData.createdBy.id" />
            </v-container>
            <v-container>
                <div>{{ postData.content }}</div>
            </v-container>
            <div align="left" style="margin: 0 -10px;">
                <CommentSection
                    :post-id="postId"
                    :is-liked="isLiked"
                    :likeCount="likeCount"
                    :recentComments="postData.recentComments"
                    :commentCount="commentCount"
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
import { db, storage } from '@/firebase'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import BurnShare from '@/components/Burn/BurnShare.vue'
import CommentSection from '@/components/Comment/CommentSection.vue'
import ExerciseShare from '@/components/Exercise/ExerciseShare.vue'
import WorkoutExpandable from '@/components/Workout/WorkoutExpandable'

export default {
    name: 'ViewPostMin',
    components: { BurnShare, CommentSection, ExerciseShare, WorkoutExpandable },
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
            likeCount: 0,
            commentCount: 0,

            createdAtText: '',

            // Firebase:
            downloadedImageCounter: 0,

            // Vuetify:
            carouselModel: 0
        }
    },

    created: function() {
        dayjs.extend(relativeTime);
    },

    mounted: function() {
        db.collection("posts").doc(this.$props.postId).get()
        .then(postDoc => {
            this.postData = postDoc.data();

            if (this.postData.filePaths.length > 0) {
                let imageDownloadPromises = [];
                
                this.postData.filePaths.forEach(imgPath => {
                    imageDownloadPromises.push(storage.ref(imgPath).getDownloadURL());
                })

                Promise.all(imageDownloadPromises).then(imgUrls => {
                    imgUrls.forEach(url => {
                        this.imgUrls.push(url);
                    })
                    
                    return this.checkIfLiked()
                })
            } else {
                return this.checkIfLiked()
            }
        })
        .then(() => {
            // Pull like and comment count.
            return db.collection("posts").doc(this.$props.docId).collection("counter").get()
        })
        .then(counterSnapshot => {
            counterSnapshot.forEach(counter => {
                this.likeCount += counter.data().likeCount;
                this.commentCount += counter.data().commentCount;
            })

            this.isLoading = false;
            this.createdAtText = dayjs(dayjs.unix(this.postData.createdAt.seconds)).fromNow();
        })
        .catch(e => {
            console.error("Error downloading post:", e);
            this.isLoading = false;
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
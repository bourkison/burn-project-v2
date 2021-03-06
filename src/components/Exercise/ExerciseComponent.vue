<template>
    <v-card v-if="!isLoading" class="exerciseMin" outlined>
        <div v-if="imgUrls.length > 1">
            <v-carousel height="auto" v-model="carouselModel" show-arrows-on-hover hide-delimiter-background>
                <v-carousel-item class="carouselImage" v-for="(img, index) in imgUrls" :key="index" eager>
                    <v-img :src="img" eager/>
                </v-carousel-item>
            </v-carousel>
        </div>
        <div v-else-if="imgUrls.length > 0">
            <v-img :src="imgUrls[0]" eager />
        </div>
        <v-container>
            <v-sheet align="center">
                <v-row>
                    <v-col cols="12" sm="6">
                        <router-link :to="'/exercises/' + userExerciseData.id"><h2 align="left">{{ exerciseData.name }}</h2></router-link>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div align="right"><v-icon large class="expandChevron" @click="descriptionToggle($event)">mdi-chevron-down</v-icon></div>
                    </v-col>
                </v-row>
                <v-container class="mdOutput" v-html="compiledMarkdown"></v-container>
                <div align="left" style="margin: 0 -10px;">
                    <CommentSection 
                        :exercise-id="this.$props.userExerciseData.id" 
                        :is-liked="isLiked" 
                        :likeCount="likeCount" 
                        :recentComments="exerciseData.recentComments"
                        :commentCount="commentCount"
                        :followCount="followCount"
                        :followableComponent="true" 
                        @likeToggle="likeToggle"
                    ></CommentSection>
                </div>
            </v-sheet>
        </v-container>
    </v-card>
    <v-card v-else min-height="500" class="exerciseMin" outlined>
        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </v-card>
</template>

<script>
import { db, storage } from '@/firebase'
import * as marked from 'marked'

import CommentSection from '@/components/Comment/CommentSection.vue'

export default {
    name: 'ViewExerciseMin',
    components: { CommentSection },
    props: {
        userExerciseData: {
            required: true,
            type: Object
        }
    },

    data() {
        return {
            isLoading: true,
            exerciseData: {},
            imgUrls: [],
            isLiked: '',

            // Counters:
            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            // Firebase: 
            downloadedImageCounter: 0,

            // Vuetify:
            carouselModel: 0,
            descriptionExpanded: false
        }
    },
    
    computed: {
        compiledMarkdown: function() {
            return marked(this.exerciseData.description);
        }
    },

    created: function() {
        // Download Exercise Data
        db.collection("exercises").doc(this.$props.userExerciseData.id).get()
        .then(exerciseDoc => {
            this.exerciseData = exerciseDoc.data();
            let imageDownloadPromises = [];

            this.exerciseData.filePaths.forEach(filePath => {
                imageDownloadPromises.push(storage.ref(filePath).getDownloadURL());
            })
            
            return Promise.all(imageDownloadPromises);
        })
        .then(imgUrls => {
            imgUrls.forEach(url => {
                this.imgUrls.push(url);
            })

            // Pull like, comment and follow count.
            return db.collection("exercises").doc(this.$props.userExerciseData.id).collection("counters").get()
        })
        .then(counterSnapshot => {
            counterSnapshot.forEach(counter => {
                this.likeCount += counter.data().likeCount;
                this.commentCount += counter.data().commentCount;
                this.followCount += counter.data().followCount;
            })

            return this.checkIfUserLiked()
        })
        .then(() => {
            this.isLoading = false;
        })
        .catch(e => {
            console.warn("Error downloading exercise data", e);
        })
    },

    methods: {
        checkIfUserLiked: function() {
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.userExerciseData.id).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            })
        },

        descriptionToggle: function(e) {
            let descContainer = e.target.parentElement.parentElement.parentElement.parentElement.querySelector(".container .mdOutput");

            if (!this.descriptionExpanded) {
                // Expand description
                descContainer.style.maxHeight = "600px";
                descContainer.style.overflowY = "scroll";
                e.target.style.transform = "rotate(180deg)";

                this.descriptionExpanded = true;
            } else {
                // Shorten description
                descContainer.style.maxHeight = "120px";
                descContainer.style.overflowY = "hidden";
                e.target.style.transform = "";

                this.descriptionExpanded = false;
            }

            document.activeElement.blur();
        },

        likeToggle: function(s) {
            if (s === '') {
                this.likeCount --;
            } else {
                this.likeCount ++;
            }

            this.isLiked = s; 
        },
    }
}
</script>

<style scoped>
    .exerciseMin {
        box-shadow: none !important;
        margin-bottom: 25px;
    }

    .exerciseMin a {
        text-decoration: none;  
        color: #fff;
    }

    .mdOutput {
        max-height: 120px;
        overflow: hidden;
    }

    .carouselImage:hover {
        cursor: pointer;
    }

    .imageDialogueCard {
        max-height: 600px;
        max-width: 900px;
    }

    .imageDialogueCard img {
        width: 100%;
        height: auto !important;
    }

    .imageDialogueCard .imageDialougeText {
        padding: 0;
    }
</style>
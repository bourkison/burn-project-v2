<template>
    <v-card v-if="!isLoading" class="exerciseMin" outlined>
        <v-carousel v-model="model">
            <v-carousel-item v-for="img in imgUrls" :key="img.id" :src="img"></v-carousel-item>
        </v-carousel>
        <v-container>
            <v-sheet align="center">
                <v-row>
                    <v-col cols="12" sm="6">
                        <router-link :to="'/exercises/' + userExerciseData.id"><h1 align="left">{{ exerciseData.name }}</h1></router-link>
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
                        :like-count="exerciseData.likeCount" 
                        :recentComments="exerciseData.recentComments"
                        :commentCount="exerciseData.commentCount"
                        :followCount="exerciseData.followCount"
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
import { db, storage } from '../../firebase'
import * as marked from 'marked'

import CommentSection from '../Comments/CommentSection.vue'

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

            // Firebase: 
            downloadedImages: 0,

            // Vuetify:
            model: 0,
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
        db.collection("exercises").doc(this.$props.userExerciseData.id).get().then(exerciseDoc => {
            this.exerciseData = exerciseDoc.data();

            this.exerciseData.imgPaths.forEach(imgPath => {
                storage.ref(imgPath).getDownloadURL().then(url => {
                    this.imgUrls.push(url);
                    this.downloadedImages ++;
                })
            })        
        })
    },

    methods: {
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
                this.exerciseData.likeCount --;
            } else {
                this.exerciseData.likeCount ++;
            }

            this.isLiked = s; 
        }
    },

    watch: {
        downloadedImages: function() {
            if (this.downloadedImages >= this.exerciseData.imgPaths.length) {
                // Check if the user has liked.
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.userExerciseData.id).get().then(likeSnapshot => {
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
</style>
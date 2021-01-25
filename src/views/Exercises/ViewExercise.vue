<template>
    <v-sheet class="mainSheet" min-height="70vh" rounded="lg">
        <v-container v-if="exerciseData.imgPaths">
            <v-card>
            <v-row class="headerRow" align="center" justify="center">
                <v-col cols="12" sm="6">
                    <h1 align="left">{{ exerciseData.name }}</h1>
                    <router-link :to="'/profile/' + exerciseData.createdBy.username">{{ exerciseData.createdBy.username }}</router-link>
                </v-col>
                <v-col cols="12" sm="6">
                    <div align="right">
                        <v-icon v-for="star in exerciseData.difficulty" color="yellow darken-2" :key="star">mdi-star</v-icon>    
                        <v-menu :offset-y="true">
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon v-bind="attrs" v-on="on">mdi-dots-vertical</v-icon>
                            </template>
                            <v-list>
                                <v-list-item @click="editExercise" selectable>Edit</v-list-item>
                                <v-list-item @click="deleteExercise" color="error" selectable>Delete</v-list-item>
                                <v-list-item @click="reportExercise" color="error" selectable>Report</v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </v-col>
            </v-row>
            </v-card>
            <v-card outlined>
                <v-carousel v-if="exerciseData.imgPaths.length > 0" v-model="model">
                    <v-carousel-item v-for="img in imgUrls" :key="img.id" :src="img.imgUrl"></v-carousel-item>
                </v-carousel>
                <v-container>
                        <v-sheet align="center">
                            <v-container class="mdOutput" v-html="compiledMarkdown"></v-container>
                            <v-card align="center" max-width="33%" class="muscleGroupCont">
                                <MuscleGroup :editable="false" :selectedGroups="exerciseData.muscleGroups"></MuscleGroup>
                            </v-card>
                        </v-sheet>
                </v-container>
            </v-card>

            <v-card outlined>
                <CommentSection 
                    :exercise-id="this.$route.params.exerciseid" 
                    :is-liked="isLiked" 
                    :like-count="exerciseData.likeCount"
                    :commentCount="exerciseData.commentCount"
                    :followableComponent="true" 
                    :recentComments="exerciseData.recentComments"
                    @likeToggle="likeToggle"
                ></CommentSection>
            </v-card>
        </v-container>

        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, storage } from '../../firebase'
import * as marked from 'marked'

import MuscleGroup from '../Utility/MuscleGroup.vue'
import CommentSection from '../Comments/CommentSection.vue'

export default {
    name: 'ViewExercise',
    components: { MuscleGroup, CommentSection },
    data() {
        return {
            exerciseExists: false,
            isLoading: true,
            exerciseData: {},
            imgUrls: [],
            isLiked: '',

            // Firebase:
            downloadedImageCounter: 0,

            // Vuetify:
            model: 0,
            starsAmount: 0
        }
    },
    created: function() {
        this.downloadExercise();
    },
    beforeRouteUpdate: function() {
        this.downloadExercise();
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.exerciseData.description);
        }
    },

    methods: {
        downloadExercise: function() {
            db.collection("exercises").doc(this.$route.params.exerciseid).get().then(exerciseDoc => {
                if (exerciseDoc.exists) {
                    this.exerciseData = exerciseDoc.data();
                    this.exerciseData.imgPaths.forEach(img => {
                        storage.ref(img).getDownloadURL().then(url => {
                            this.imgUrls.push({id: this.downloadedImageCounter, imgUrl: url});
                            this.downloadedImageCounter++;
                        })
                    })
                } else {
                    this.exerciseExists = false;
                    this.isLoading = false;
                }
                this.isLoading = false;
            })
        },

        editExercise: function() {
            console.log("edit");
        },

        deleteExercise: function() {
            console.log("delete");
        },

        reportExercise: function() {
            console.log("report");
        },

        likeToggle: function(s) {
            this.isLiked = s;
        }
    },

    watch: {
        // Done loading the exeracise.
        downloadedImageCounter: function() {
            if (this.downloadedImageCounter >= this.exerciseData.imgPaths.length) {
                this.exerciseExists = true;
                this.starsAmount = this.exerciseData.difficulty;
                // Check if the user has liked.
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$route.params.exerciseid).get().then(likeSnapshot => {
                    likeSnapshot.forEach(like => {
                        if (like.exists) {
                            this.isLiked = like.id;
                        }
                    })
                    this.isLoading = false;
                });
            }
        }
    }
}
</script>

<style scoped>
    .headerRow {
        padding: 10px 10px 10px 20px;
    }

    .mainSheet {
        color: var(--v-primary-base);
    }

    .muscleGroupCont {
        box-shadow: none !important;
    }
</style>
<template>
    <v-sheet class="mainSheet" min-height="70vh" rounded="lg">
        <v-container v-if="!isLoading && exerciseExists">
            <v-card>
                <v-row class="headerRow" align="center" justify="center">
                    <v-col cols="12" sm="6">
                        <h2 align="left">{{ exerciseData.name }}</h2>
                        <router-link :to="'/' + exerciseData.createdBy.username">{{ exerciseData.createdBy.username }}</router-link>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div align="right">
                            <v-icon v-for="star in exerciseData.difficulty" color="yellow darken-2" :key="star">mdi-star</v-icon>    
                            <v-menu :offset-y="true">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on">mdi-dots-vertical</v-icon>
                                </template>
                                <v-list>
                                    <v-list-item @click="editExercise" v-if="exerciseData.createdBy.id == $store.state.userProfile.data.uid" selectable>Edit</v-list-item>
                                    <v-list-item @click.stop="isDeletingDialogue = true" v-if="exerciseData.createdBy.id == $store.state.userProfile.data.uid" color="error" selectable>Delete</v-list-item>
                                    <v-list-item @click="reportExercise" color="error" selectable>Report</v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </v-col>
                </v-row>
            </v-card>
            <v-card outlined>
                <div v-if="imgUrls.length > 1">
                    <v-carousel v-model="model" show-arrows-on-hover hide-delimiter-background height="auto">
                        <v-carousel-item class="carouselImage" v-for="(img, index) in imgUrls" :key="index" @click.stop="popUpImage(img)" eager>
                            <v-img :src="img" eager/>
                        </v-carousel-item>
                    </v-carousel>
                </div>
                <div v-else-if="imgUrls.length > 0">
                    <v-img :src="imgUrls[0]" eager />
                </div>
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
                    :exerciseId="this.$route.params.exerciseid" 
                    :isLiked="isLiked" 
                    :likeCount="likeCount"
                    :commentCount="commentCount"
                    :followCount="followCount"
                    :followableComponent="true" 
                    @likeToggle="likeToggle"
                ></CommentSection>
            </v-card>
            <!-- Delete Confirm Dialog -->
            <v-dialog
                v-if="exerciseData.createdBy.id == $store.state.userProfile.data.uid"
                v-model="isDeletingDialogue"
                width="500"
                persistent
            >
                <v-card>
                    <v-card-title>Delete?</v-card-title>
                    <v-card-text>Are you sure you want to delete? You can not un-delete.</v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="isDeletingDialogue = false" v-if="!isDeleting">Cancel</v-btn>
                        <v-btn text color="error" @click="deleteExercise" :loading="isDeleting">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <!-- End Delete Dialogue -->
        </v-container>
        <v-container v-else-if="!isLoading && !exerciseExists">
            <div>404 NOT FOUND.</div>
        </v-container>

        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>

        <!-- Image Dialog -->
        <v-dialog v-model="viewingImageDialogue" max-height="900" max-width="600">
            <v-card class="imageDialogueCard">
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-icon @click="viewingImageDialogue = false">mdi-close</v-icon>
                </v-card-actions>
                <v-card-text class="imageDialougeText"><img :src="imageDialogueUrl"/></v-card-text>
            </v-card>
        </v-dialog>
        <!-- End Image Dialog -->
    </v-sheet>
</template>

<script>
import { db, storage, functions } from '@/firebase'
import * as marked from 'marked'

import MuscleGroup from '@/components/MuscleGroup.vue'
import CommentSection from '@/components/Comment/CommentSection.vue'

export default {
    name: 'ExerciseView',
    components: { MuscleGroup, CommentSection },
    data() {
        return {
            exerciseExists: false,
            isLoading: true,
            isDeleting: false,
            exerciseData: {},
            imgUrls: [],
            isLiked: '',
            errorMessage: '',

            // Counters:
            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            // Firebase:
            downloadedImageCounter: 0,

            // Vuetify:
            model: 0,
            starsAmount: 0,
            isDeletingDialogue: false,
            viewingImageDialogue: false,
            imageDialogueUrl: ''
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
        checkIfLiked: function() {
            // Check if the user has liked.
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$route.params.exerciseid).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            });
        },

        downloadExercise: function() {
            db.collection("exercises").doc(this.$route.params.exerciseid).get()
            .then(exerciseDoc => {
                if (exerciseDoc.exists) {
                    this.exerciseData = exerciseDoc.data();
                    let imageDownloadPromises = [];

                    this.exerciseData.filePaths.forEach(filePath => {
                        imageDownloadPromises.push(storage.ref(filePath).getDownloadURL());
                    })

                    return Promise.all(imageDownloadPromises);
                } else {
                    this.exerciseExists = false;
                    this.isLoading = false;

                    throw new Error("Exercise does not exist.");
                }
            })
            .then(imgUrls => {
                imgUrls.forEach(url => {
                    this.imgUrls.push(url);
                })

                this.exerciseExists = true;
                this.starsAmount = this.exerciseData.difficulty;

                // Pull like, comment and follow count.
                return db.collection("exercises").doc(this.$route.params.exerciseid).collection("counters").get()

            })
            .then(counterSnapshot => {
                counterSnapshot.forEach(counter => {
                    console.log(counter.data().likeCount);
                    this.likeCount += counter.data().likeCount;
                    this.commentCount += counter.data().commentCount;
                    this.followCount += counter.data().followCount;
                })

                return this.checkIfLiked()
            })
            .then(() => {
                this.isLoading = false;
            })
            .catch(e => {
                console.error("Error downloading exercise:", e);
            })
        },

        editExercise: function() {
            this.$router.push("/exercises/" + this.$route.params.exerciseid + "/edit");
        },

        deleteExercise: function() {
            // As deleting an exercise would be too resource intensive, we must call a Firebase Function.
            // This deletes this document, all subcollections underneath, as well as the documents for all follows that follow this.
            this.isDeleting = true;
            let deleteFunction = functions.httpsCallable("deleteCollection");
            let path = "exercises/" + this.$route.params.exerciseid;

            deleteFunction({ path: path }).then(result => {
                console.log("Success", result);
                this.isDeleting = false;
                this.isDeletingDialogue = false;
                this.$router.push("/exercises");
            }).catch(e => {
                console.log("Failure", e);
            })

        },

        reportExercise: function() {
            console.log("report");
        },

        likeToggle: function(s) {
            if (s) {
                this.likeCount ++;
            } else {
                this.likeCount --;
            }
            this.isLiked = s;
        },

        popUpImage: function(url) {
            this.viewingImageDialogue = true;
            this.imageDialogueUrl = url;
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
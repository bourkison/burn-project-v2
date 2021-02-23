<template>
    <v-card outlined>
        <v-container>
            <div style="margin-bottom:20px;"><h3>New Post</h3></div>
            <v-row justify="center" align="center" id="sortableContainer">
                <v-col class="sortableCol" cols="12" md="4" v-for="image in imageObjs" :key="image.id">
                    <v-card outlined>
                        <img :src="image.tempUrl"/>
                        <div align="center" style="padding:10px;">
                            <v-icon v-if="!image.path" @click.stop="editImageToggle(image.id)">mdi-image-edit-outline</v-icon>
                            <v-icon @click="deleteImage(image.id)">mdi-delete-outline</v-icon>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
            <v-row v-if="selectedExercise">
                <v-container>
                    <div align="right">
                        <v-spacer/>
                        <v-btn icon @click="selectedExercise = null;"><v-icon small color="error">mdi-close</v-icon></v-btn>
                    </div>
                    <ExerciseShare :exerciseObj="selectedExercise" />
                </v-container>
            </v-row>
            <v-row v-if="selectedWorkout">
                <v-container>
                    <div align="right">
                        <v-spacer/>
                        <v-btn icon @click="selectedWorkout = null;"><v-icon small color="error">mdi-close</v-icon></v-btn>
                    </div>
                    <WorkoutShare :workoutObj="selectedWorkout" />
                </v-container>
            </v-row>
            <v-row v-if="selectedRecentWorkout">
                <v-container>
                    <div align="right">
                        <v-spacer/>
                        <v-btn icon @click="selectedRecentWorkout = null;"><v-icon small color="error">mdi-close</v-icon></v-btn>
                    </div>
                    <BurnShare :burnObj="selectedRecentWorkout" />
                </v-container>
            </v-row>
            <div style="margin-top:15px;">
                <v-textarea v-model="postForm.content" label="Add text here..." auto-grow counter outlined></v-textarea>
            </div>
            <v-row style="padding: 10px 5px 10px 20px;">
                <span align="left">
                    <v-file-input v-model="imageFiles" @change="handleFileUpload" style="display:inline;margin:0;padding:0;" accept="image/png,image/jpg,image/jpeg" prepend-icon="mdi-camera" hide-input></v-file-input>
                    <v-btn icon @click.stop="exerciseSearchDialogue = true;"><v-icon>mdi-dumbbell</v-icon></v-btn>
                    <v-btn icon @click.stop="workoutSearchDialogue = true;"><v-icon>mdi-weight-lifter</v-icon></v-btn>
                    <v-btn icon @click.stop="recentWorkoutSearchDialogue = true;"><v-icon>mdi-fire</v-icon></v-btn>
                </span>
                <v-spacer />
                <span align="right">
                    <v-btn @click="createPost" :loading="isLoading" text>Post</v-btn>
                </span>
            </v-row>
        </v-container>

        <v-dialog max-height="600" max-width="900" v-model="editingImageDialogue" persistent eager>
            <v-card v-for="img in imagesToEdit" :key="img.id">
                <div v-if="img.dialogueOpen">
                    <v-card-title>Edit Image</v-card-title>
                    <v-card-text ref="dialogueContainer">
                        <ImageEditorDialogue :imgFile="img.file" :imgId="img.id" @outputEdit="outputEdit" />
                    </v-card-text>
                </div>
            </v-card>
        </v-dialog>

        <v-dialog v-model="exerciseSearchDialogue" style="min-height:300px;" max-width="600">
            <ExerciseSearch @selectExercise="addExercise" />
        </v-dialog>

        <v-dialog v-model="workoutSearchDialogue" style="min-height:300px;" max-width="600">
            <WorkoutSearch @selectWorkout="addWorkout" />
        </v-dialog>

        <v-dialog v-model="recentWorkoutSearchDialogue" style="min-height:300px;" max-width="600">
            <BurnSearch @selectBurn="addBurn" />
        </v-dialog>
    </v-card>
</template>

<script>
import Sortable from 'sortablejs'
import { storage, functions } from '@/firebase'

import BurnShare from '@/components/Burn/BurnShare.vue'
import ExerciseShare from '@/components/Exercise/ExerciseShare.vue'
import WorkoutShare from '@/components/Workout/WorkoutShare.vue'
import ImageEditorDialogue from '@/components/ImageEditorDialogue.vue'

import ExerciseSearch from '@/components/Search/ExerciseSearch.vue'
import BurnSearch from '@/components/Search/BurnSearch.vue'
import WorkoutSearch from '@/components/Search/WorkoutSearch.vue'


export default {
    name: 'PostNew',
    components: { BurnShare, BurnSearch, ExerciseShare, ExerciseSearch, ImageEditorDialogue, WorkoutShare, WorkoutSearch },
    props: {
        initShareBurn: {
            type: Object,
            required: false
        }
    },
    data() {
        return {
            isLoading: false,
            postForm: {
                content: '',
                share: {
                    id: '',
                    type: ''
                },
                filePaths: []
            },
            imageFiles: [],
            imagesToEdit: [],
            imageEditIncrementor: 0,
            imageObjs: [],

            selectedExercise: null,
            selectedRecentWorkout: null,
            selectedWorkout: null,

            // Sortable:
            sortable: null,
            sortableOptions: {
                animation: 300,
                onEnd: this.changeOrder
            },

            // Vuetify:
            editingImageDialogue: false,
            exerciseSearchDialogue: false,
            workoutSearchDialogue: false,
            recentWorkoutSearchDialogue: false
        }
    },

    created: function() {
        this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });

        if (this.$props.initShareBurn) {
            this.selectedRecentWorkout = this.$props.initShareBurn;
        }
    },

    methods: {
        createPost: function() {
            this.isLoading = true;
            let imageUploadPromises = [];

            if (this.selectedExercise) {
                this.postForm.share = { id: this.selectedExercise.id, type: "exercises" }
            } else if (this.selectedWorkout) {
                this.postForm.share = { id: this.selectedWorkout.id, type: "workouts" }
            } else if (this.selectedRecentWorkout) {
                this.postForm.share = { id: this.selectedRecentWorkout.id, type: "burns" }
            }

            // Build the post ID.
            this.postForm.id = this.generateId(16);

            // Then upload images if user has inputted any.
            if (this.imageObjs.length > 0) {
                this.imageObjs.forEach(img => {
                    let imageRef = storage.ref("posts/" + this.postForm.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                    imageUploadPromises.push(imageRef.putString(img.file, 'data_url'));
                    this.postForm.filePaths.push(imageRef.fullPath);
                })
            }

            // Once uploaded, call the Firebase function.
            Promise.all(imageUploadPromises)
            .then(() => {
                const createPost = functions.httpsCallable("createPost");
                const user = { username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhoto };

                return createPost({ postForm: this.postForm, user: user });
            })
            .then(() => {
                this.$emit("newPost", this.postForm);
                this.isLoading = false;

                if (this.$props.initShareBurn) {
                    this.$router.push("/");
                }

                this.resetVariables();
            })
            .catch(e => {
                console.error("Error creating post:", e);
                this.isLoading = false;
            })
        },

        handleFileUpload: function(e) {
            this.imageFiles = e;
            this.imagesToEdit[this.imageEditIncrementor].file = e;
            this.imagesToEdit[this.imageEditIncrementor].dialogueOpen = true;
            this.editingImageDialogue = true;
        },

        outputEdit: function(s, id) {
            this.editingImageDialogue = false;
            console.log(this.imagesToEdit)
            this.imagesToEdit[id].dialogueOpen = false;

            if (id != this.imageEditIncrementor) {
                let imageObjsIndex = this.imageObjs.findIndex(x => x.id === id);
                this.imageObjs[imageObjsIndex] = { id: id, file: s, tempUrl: s, path: null }
            } else {
                this.imageObjs.push({ id: id, file: s, tempUrl: s, path: null });
                this.imageEditIncrementor ++;
                this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
            }
        },

        editImageToggle: function(id) {
            let imageEditIndex = this.imagesToEdit.findIndex(x => x.id === id);
            this.editingImageDialogue = true;
            this.imagesToEdit[imageEditIndex].dialogueOpen = true;
        },

        deleteImage: function(id) {
            let index = this.imageObjs.findIndex(x => x.id === id);
            this.imageObjs.splice(index, 1);
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.imageObjs.splice(e.newIndex, 0, this.imageObjs.splice(e.oldIndex, 1)[0]);
            }
        },

        generateId(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },

        // This is called once post is uploaded and resets all variables.
        resetVariables: function() {
            this.postForm = { content: '', share: { id: '', type: '' }, filePaths: [] };
            this.imageFiles = [];
            this.imagesToEdit = [];
            this.imageEditIncrementor = 0;
            this.imageObjs = [];
            this.selectedExercise = null;
            this.selectedWorkout = null;
            this.selectedRecentWorkout = null;

            this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
        },

        addExercise: function(exercise) {
            this.exerciseSearchDialogue = false;
            this.selectedExercise = exercise;
            this.selectedWorkout = null;
            this.selectedRecentWorkout = null;
        },

        addWorkout: function(workout) {
            this.workoutSearchDialogue = false;

            this.selectedWorkout = workout;
            this.selectedExercise = null;
            this.selectedRecentWorkout = null;
        },

        addBurn: function(recentWorkout) {
            this.recentWorkoutSearchDialogue = false;

            this.selectedRecentWorkout = recentWorkout;
            this.selectedExercise = null;
            this.selectedWorkout = null;
        }
    },

    watch: {
        imageObjs: function(n) {
            if (n.length > 0 && !this.sortable) {
                this.sortable = new Sortable(document.getElementById("sortableContainer"), this.sortableOptions);
            } else {
                this.sortable = null;
            }
        }
    }
}
</script>

<style scoped>
    .sortableCol img {
        width: 100%;
        height: auto;
    }

    .sortableCol img:hover {
        cursor: pointer;
    }
</style>
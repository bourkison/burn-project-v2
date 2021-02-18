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
                    <v-expansion-panels>
                        <ExerciseExpandable :exercise="selectedExercise"></ExerciseExpandable>
                    </v-expansion-panels>
                </v-container>
            </v-row>
            <v-row v-if="selectedWorkout">
                <v-container>
                    <WorkoutExpandable :workout="selectedWorkout"></WorkoutExpandable>
                </v-container>
            </v-row>
            <div style="margin-top:15px;">
                <v-textarea v-model="postForm.content" label="Add text here..." auto-grow counter outlined></v-textarea>
            </div>
            <div>
                <v-file-input v-model="imageFiles" @change="handleFileUpload" style="display:inline;margin:0;padding:0;" accept="image/png,image/jpg,image/jpeg" prepend-icon="mdi-camera" hide-input></v-file-input>
                <v-btn icon @click.stop="exerciseSearchDialogue = true;"><v-icon>mdi-dumbbell</v-icon></v-btn>
                <v-btn icon @click.stop="workoutSearchDialogue = true;"><v-icon>mdi-weight-lifter</v-icon></v-btn>
            </div>
            <div align="right"><v-btn @click="createPost" :loading="isLoading" text>Post</v-btn></div>
        </v-container>

        <v-dialog max-height="600" max-width="900" v-model="editingImageDialogue" persistent eager>
            <v-card v-for="img in imagesToEdit" :key="img.id">
                <div v-if="img.dialogueOpen">
                    <v-card-title>Edit Image</v-card-title>
                    <v-card-text ref="dialogueContainer">
                        <ImageEditorDialogue :imgUrl="img.url" :imgId="img.id" @outputEdit="outputEdit"></ImageEditorDialogue>
                    </v-card-text>
                </div>
            </v-card>
        </v-dialog>

        <v-dialog v-model="exerciseSearchDialogue" style="min-height:300px;" max-width="600">
            <ExerciseSearch @selectExercise="addExercise"></ExerciseSearch>
        </v-dialog>

        <v-dialog v-model="workoutSearchDialogue" style="min-height:300px;" max-width="600">
            <WorkoutSearch @selectWorkout="addWorkout"></WorkoutSearch>
        </v-dialog>
    </v-card>
</template>

<script>
import Sortable from 'sortablejs'
import { db, storage } from '@/firebase'

import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'
import WorkoutExpandable from '@/components/Workout/WorkoutExpandable.vue'
import ImageEditorDialogue from '@/components/ImageEditorDialogue.vue'

import ExerciseSearch from '@/components/Search/ExerciseSearch.vue'
import WorkoutSearch from '@/components/Search/WorkoutSearch.vue'


export default {
    name: 'NewPost',
    components: { ExerciseExpandable, ExerciseSearch, ImageEditorDialogue, WorkoutExpandable, WorkoutSearch },
    data() {
        return {
            isLoading: false,
            postForm: {
                content: '',
                exercise: null,
                workout: null,
                burn: null,
                imgPaths: []
            },
            imageFiles: [],
            imagesToEdit: [],
            imageEditIncrementor: 0,
            imageObjs: [],

            selectedExercise: null,
            selectedWorkout: null,

            // Sortable:
            sortable: null,
            sortableOptions: {
                animation: 300,
                onEnd: this.changeOrder
            },

            // Firebase:
            idAttempts: 0,
            imagesUploaded: 0,

            // Vuetify:
            editingImageDialogue: false,
            exerciseSearchDialogue: false,
            workoutSearchDialogue: false
        }
    },

    created: function() {
        this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
    },

    methods: {
        createPost: function() {
            this.isLoading = true;
            this.postForm.createdBy = { id: this.$store.state.userProfile.data.uid, username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhotoUrl };
            this.postForm.createdAt = new Date();
            this.postForm.likeCount = 0;
            this.postForm.recentComments = [];
            this.postForm.commentCount = 0;

            if (this.selectedExercise) {
                this.postForm.exercise = { name: this.selectedExercise.name, id: this.selectedExercise.id }
            } else if (this.selectedWorkout) {
                let temp = [];

                this.selectedWorkout.exercises.forEach(exercise => {
                    temp.push({ name: exercise.name, id: exercise.id })
                })

                this.postForm.workout = { name: this.selectedWorkout.name, exercises: temp, id: this.selectedWorkout.id }
            }

            // Setting this to 1 will call our watcher, which begins our upload process.
            // We must make an ID rather than generate one in Firebase, so our storage can match.
            this.idAttempts = 1;
            // db.collection("posts").add(this.postForm)
        },

        uploadImageFile: function(file, order) {
            let imageRef = storage.ref("posts/" + this.postForm.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));

            imageRef.putString(file, 'data_url').then(() => {
                console.log(this.postForm.imgPaths);
                this.postForm.imgPaths.push({ path: imageRef.fullPath, order: order });
                this.imagesUploaded ++;
            }).catch(e => {
                console.log("Error uploading images:", e);
            })
        },

        handleFileUpload: function(e) {
            this.imageFiles = e;
            this.imagesToEdit[this.imageEditIncrementor].url = URL.createObjectURL(e);
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

        createPostDocument: function() {
            // Now upload the doc.
            db.collection("posts").doc(this.postForm.id).set(this.postForm).then(() => {
                let postPayload = { createdAt: this.postForm.createdAt }
                // Doc created, lets push the ID to the user doc.
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("posts").doc(this.postForm.id).set(postPayload).then(() => {
                    console.log("POSTED");
                    this.isLoading = false;
                    this.$emit("newPost", this.postForm);
                    this.resetVariables();
                }).catch(e => {
                    console.warn("Error updating user:", e);
                })
            }).catch(e => {
                console.warn("Error uploading post:", e);
            })
        },

        // This is called once post is uploaded and resets all variables.
        resetVariables: function() {
            this.postForm = { content: '', exercise: null, workout: null, burn: null, imgPaths: [] };
            this.imageFiles = [];
            this.imagesToEdit = [];
            this.imageEditIncrementor = 0;
            this.imageObjs = [];
            this.imagesUploaded = 0;

            this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
        },

        addExercise: function(exercise) {
            console.log(exercise);
            this.exerciseSearchDialogue = false;
            this.selectedExercise = exercise;
        },

        addWorkout: function(workout) {
            this.workoutSearchDialogue = false;
            this.selectedWorkout = workout;
            console.log(this.selectedWorkout);

            this.selectedExercise = null;
        }
    },

    watch: {
        imageObjs: function(n) {
            if (n.length > 0 && !this.sortable) {
                this.sortable = new Sortable(document.getElementById("sortableContainer"), this.sortableOptions);
            } else {
                this.sortable = null;
            }
        },

        idAttempts: function() {
            this.postForm.id = this.generateId(16);

            db.collection("posts").doc(this.postForm.id).get().then(idTestDoc => {
                if (!idTestDoc.exists) {
                    if (this.imageObjs.length > 0) {
                        let i = 0;
                        this.imageObjs.forEach(img => {
                            this.uploadImageFile(img.file, i);
                            i ++;
                        })
                    } else {
                        console.log("no images");
                        this.createPostDocument();
                    }
                } else {
                    // Increment id attempts to start this process again.
                    this.idAttempts ++;
                }
            })
        },

        imagesUploaded: function() {
            console.log("test");
            if (this.imagesUploaded >= this.imageObjs.length && this.isLoading) {
                // Order imgPaths array based on the order key/val
                let tempArr = [];
                for (let i = 0; i < this.postForm.imgPaths.length; i ++) {
                    let index = this.postForm.imgPaths.findIndex(x => x.order === i);
                    tempArr.push(this.postForm.imgPaths[index].path);
                }
                this.postForm.imgPaths = tempArr;

                this.createPostDocument();
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
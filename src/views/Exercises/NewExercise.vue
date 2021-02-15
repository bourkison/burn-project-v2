<!-- 
    exercise: 
    {
        name: string,
        description: string,
        muscleGroups: array of strings, // Lists all muscle groups he exercise targets.
        suggestedMeasure: string, // Suggested way to calculate exercise (i.e. reps, reps and weight, time, etc)
        suggestedSets: object, // Suggested reps/sets.
        difficulty: integer,
        imgUrl: array of URL strings,
        videoSrc: video src string,
        createdBy: userId,
        createdAt: Timestamp
    }
-->

<template>
    <v-sheet>
        <v-container>
            <h1 align="center">{{ exerciseForm.name ? exerciseForm.name : 'New Exercise' }}</h1>
            <v-form @submit.prevent="createExercise">
                <v-text-field
                    v-model="exerciseForm.name"
                    label="Exercise Name"
                    :rules=[rules.required]
                ></v-text-field>
                <ExerciseImageUploader @updateImgFiles="updateImgFiles"></ExerciseImageUploader>
                <MarkdownInput @update-text="updateDescription"></MarkdownInput>
                <v-row align="center" justify="center">
                    <v-col cols="12" md="6"><MuscleGroupSelect @mgCH="updateMgs"></MuscleGroupSelect></v-col>
                    <v-col cols="12" md="6">
                        <v-card align="center" outlined>
                            <SuggestedSetsSelector @updateSets="updateSets"></SuggestedSetsSelector>
                        </v-card>
                        <DifficultySelector class="difficultyCard" @setDifficulty="setDifficulty"></DifficultySelector>
                    </v-col>
                </v-row>
                <div class="text-center"><v-btn type="submit" v-bind:loading="isLoading" :disabled="isLoading">Create Exercise</v-btn></div>
            </v-form>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, storage } from '../../firebase'

import ExerciseImageUploader from '../../components/Exercise/ExerciseImageUploader.vue'
import MarkdownInput from '../../components/MarkdownInput.vue'
import DifficultySelector from '../../components/DifficultySelector.vue'
import MuscleGroupSelect from '../../components/MuscleGroupSelect.vue'
import SuggestedSetsSelector from '../../components/Exercise/SuggestedSetsSelector.vue'

export default {
    name: "NewExercise",
    components: { ExerciseImageUploader, MarkdownInput, MuscleGroupSelect, DifficultySelector, SuggestedSetsSelector },
    data() {
        return {
            exerciseForm: {
                name: '',
                description: '',
                muscleGroups: [],
                difficulty: 1,
                imgPaths: [],
                suggestedSets: [{id: 0}],
                videoSrc: ''
            },
            isLoading: false,
            imageFiles: [],
            imgIterator: 0,
            setIterator: 0,
            errorMessage: '',

            // Firebase:
            idAttempts: 0,
            imagesUploaded: 0,

            // Vuetify:
            model: 0,
            rules: {
                required: value => !!value || 'Required.',
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },

    methods: {
        createExercise() {
            this.isLoading = true;
            this.exerciseForm.createdBy = {id: this.$store.state.userProfile.data.uid, username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhotoUrl};
            this.exerciseForm.createdAt = new Date();
            
            this.exerciseForm.suggestedSets.forEach (s => {
                delete s.id;
                s.measureAmount = Number(s.measureAmount);
            })

            // Setting this to 1 will call our watcher, which will begin the upload process.
            this.idAttempts = 1

            // let imageRef = storage.child("exercises/" + this.$store.state.userProfile.data.uid + "")            
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

        updateDescription(t) {
            this.exerciseForm.description = t;
        },

        setDifficulty(d) {
            this.exerciseForm.difficulty = d;
        },

        updateMgs (mg) {
            this.exerciseForm.muscleGroups = mg;
        },

        updateSets (sets) {
            this.exerciseForm.suggestedSets = sets;
        },

        updateImgFiles (arr) {
            this.imageFiles = [];
            arr.forEach(img => {
                this.imageFiles.push(img.file);
            })
            // this.imageFiles = arr;
        },

        // This is called in the idAttempts watcher.
        // This function is run to keep the order of the images.
        uploadImageFile: function(file, order) {
            let imageRef = storage.ref("exercises/" + this.exerciseForm.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));

            imageRef.putString(file, 'data_url').then(() => {
                this.exerciseForm.imgPaths.push({ path: imageRef.fullPath, order: order });
                this.imagesUploaded ++;
            }).catch(e => {
                this.errorMessage = "Error uploading images: " + e;
                console.log(this.errorMessage);
            })
        }
    },

    watch: {
        // This watcher tests for uniqueness of exercise id, then starts upload on images.
        // Will call imagesUploaded watcher when completed.
        idAttempts: function() {
            let firstHalfId = this.exerciseForm.name.replaceAll(/[^A-Za-z0-9]/g, "").substring(0, 8).toLowerCase()
            if (firstHalfId.length > 0) {
                firstHalfId += "-";
            }
            this.exerciseForm.id = firstHalfId + this.generateId(15 - firstHalfId.length);
            this.exerciseForm.likeCount = 0;
            this.exerciseForm.recentComments = [];
            this.exerciseForm.commentCount = 0;
            this.exerciseForm.followCount = 0;

            db.collection("exercises").doc(this.exerciseForm.id).get().then(idTestDoc => {
                if (!idTestDoc.exists) {
                    // We upload images first so their references can be added to the Exercise doc.
                    let i = 0;
                    this.imageFiles.forEach(img => {
                        this.uploadImageFile(img, i);
                        i ++;
                    })
                } else {
                    this.idAttempts ++;
                }
            })
        },

        // Once our images have uploaded, we can get started on uploading the exercise doc.
        imagesUploaded: function() {
            if (this.imagesUploaded >= this.imageFiles.length) {
                // First we need to order our imgPaths array to be in the correct order.
                let tempArr = [];
                for (let i = 0; i < this.exerciseForm.imgPaths.length; i ++) {
                    let index = this.exerciseForm.imgPaths.findIndex(x => x.order === i);
                    tempArr.push(this.exerciseForm.imgPaths[index].path);
                }
                this.exerciseForm.imgPaths = tempArr;

                // Now we can upload the doc.
                db.collection("exercises").doc(this.exerciseForm.id).set(this.exerciseForm).then(() => {
                    let exercisePayload = { createdAt: this.exerciseForm.createdAt, isFollow: false, createdBy: this.exerciseForm.createdBy }                    
                    // Doc now created, lets push the exercise ID to the user doc.
                    db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").doc(this.exerciseForm.id).set(exercisePayload).then(() => {
                        this.$router.push("/exercises/" + this.exerciseForm.id);
                    }).catch(e => {
                        this.errorMessage = "Error updating user: " + e;
                        console.log(e);
                    })
                }).catch(e => {
                    this.errorMessage = "Error uploading exercise: " + e;
                    console.log(e);
                })
            }
        }

    }
}
</script>

<style scoped>
    input {
        margin-bottom: 10px;
    }

    button {
        margin: 10px 0 5px;
    }

    .imageUpload,
    .difficultyCard {
        margin-top: 10px;
    }

    .imageUpload .v-input {
        padding-left: 10px;
        padding-right: 10px;
        margin-top: 10px;
    }

    .setsAdder .v-icon {
        right: 10px;
    }
</style>
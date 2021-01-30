<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <h1>{{ newExerciseData.name }}</h1>
            <v-text-field v-model="newExerciseData.name" label="Exercise Name"></v-text-field>
            <div>TODO: Image</div>
            <MarkdownInput :starting-text="oldExerciseData.description" @update-text="updateDescription"></MarkdownInput>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, storage } from '../../firebase'
import MarkdownInput from '../../components/MarkdownInput'

export default {
    name: 'EditExercise',
    components: { MarkdownInput },
    data() {
        return {
            isLoading: true,
            oldExerciseData: {},
            newExerciseData: {},
            imgUrls: [],

            // Firebase:
            downloadImageCounter: 0,

            // Vuetify:
            rules: {
                required: value => !!value || 'Required.',
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },
    created: function() {
        this.downloadExercise()
    },
    beforeRouteUpdate: function() {
        this.downloadExercise();
    },
    methods: {
        downloadExercise: function() {
            db.collection("exercises").doc(this.$route.params.exerciseid).get().then(exerciseDoc => {
                if (exerciseDoc.exists) {
                    this.oldExerciseData = exerciseDoc.data();
                    this.newExerciseData = exerciseDoc.data();

                    this.newExerciseData.imgPaths.forEach(img => {
                        storage.ref(img).getDownloadURL().then(url => {
                            this.imgUrls.push({ id: this.downloadImageCounter, imgUrl: url });
                            this.downloadImageCounter ++;
                        })
                    })
                } else {
                    this.isLoading = false;
                    console.log("Error, this exercise does not exist.");
                }
            }).catch(e => {
                console.log("Error downloading exercise.", e);
                this.isLoading = false;
            })
        },

        updateDescription: function(t) {
            this.newExerciseData.description = t;
        }
    },

    watch: {
        downloadImageCounter: function() {
            if (this.downloadImageCounter >= this.newExerciseData.imgPaths.length) {
                this.isLoading = false;
            }
        }
    }
}
</script>
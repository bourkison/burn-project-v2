<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <h1>{{ newExerciseData.name }}</h1>
            <v-text-field v-model="newExerciseData.name" :rules=[rules.required] label="Exercise Name"></v-text-field>
            <div>TODO: Image</div>
            <MarkdownInput :starting-text="oldExerciseData.description" @update-text="updateDescription"></MarkdownInput>
            <v-row>
                <v-col cols="12" sm="6">
                    <MuscleGroupSelect :selectedMgs="oldExerciseData.muscleGroups" @mgCH="updateMgs"></MuscleGroupSelect>
                    <v-card class="difficultyCard" align="center" outlined style="margin-top: 10px;">
                        <h2>Difficulty</h2>
                        <v-icon :color="stars[0].color" @click="starClick(0)" @mouseover="starHover(true, 0)" @mouseleave="starHover(false, 0)" x-large>{{ stars[0].icon }}</v-icon>
                        <v-icon :color="stars[1].color" @click="starClick(1)" @mouseover="starHover(true, 1)" @mouseleave="starHover(false, 1)" x-large>{{ stars[1].icon }}</v-icon>
                        <v-icon :color="stars[2].color" @click="starClick(2)" @mouseover="starHover(true, 2)" @mouseleave="starHover(false, 2)" x-large>{{ stars[2].icon }}</v-icon>
                        <v-icon :color="stars[3].color" @click="starClick(3)" @mouseover="starHover(true, 3)" @mouseleave="starHover(false, 3)" x-large>{{ stars[3].icon }}</v-icon>
                        <v-icon :color="stars[4].color" @click="starClick(4)" @mouseover="starHover(true, 4)" @mouseleave="starHover(false, 4)" x-large>{{ stars[4].icon }}</v-icon>
                    </v-card>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-card style="margin-top:10px;" align="center" outlined>
                        <v-container class="setsAdder">
                            <h2>Suggested Sets</h2>
                            <v-row v-for="set in newExerciseData.suggestedSets" :key="set.id" align="center" justify="center" style="border-bottom: 1px solid var(--v-secondary-base);">
                                <v-col cols="12" xl="6" sm="12">
                                    <v-select :items="measureByOptions" v-model="set.measureBy"></v-select>
                                </v-col>
                                <v-col cols="12" xl="5" sm="10">
                                    <v-text-field v-if="set.measureBy == 'Time'" label="Suggested Time (secs)" :rules=[rules.isNumber] v-model="set.measureAmount"></v-text-field>
                                    <v-text-field v-if="set.measureBy == 'Reps'" label="Suggested Reps" :rules=[rules.isNumber] v-model="set.measureAmount"></v-text-field>
                                </v-col>

                                <v-col cols="12" xl="1" sm="2">
                                    <v-icon width="100%" @click="deleteSet(set.id)" color="error">mdi-close</v-icon>
                                </v-col>
                            </v-row>
                            <v-btn @click="addSet" style="margin-top: 25px;">Add Set</v-btn>
                        </v-container>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, storage } from '../../firebase'
import MarkdownInput from '../../components/MarkdownInput'
import MuscleGroupSelect from '../../components/MuscleGroupSelect'

export default {
    name: 'EditExercise',
    components: { MarkdownInput, MuscleGroupSelect },
    data() {
        return {
            isLoading: true,
            oldExerciseData: {},
            newExerciseData: {},
            imgUrls: [],
            setIterator: 0,

            // Firebase:
            downloadImageCounter: 0,

            // Vuetify:
            measureByOptions: ["Time", "Reps"],
            stars: [
                {color: "yellow darken-2", icon: "mdi-star", hover: false, clicked: true},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false}

            ],
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

                    // Set suggested sets
                    this.newExerciseData.suggestedSets.forEach(s => {
                        s.id = this.setIterator;
                        this.setIterator ++;
                    })

                    // Set stars:
                    this.starClick(this.newExerciseData.difficulty - 1);

                    // Download images:
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

        addSet: function() {
            this.setIterator ++;
            this.newExerciseData.suggestedSets.push({ id: this.setIterator, measureBy: this.newExerciseData.suggestedSets[this.newExerciseData.suggestedSets.length - 1].measureBy })
        },

        deleteSet: function(i) {
            if (this.newExerciseData.suggestedSets.length > 1) {
                let index = this.newExerciseData.suggestedSets.findIndex(x => x.id === i);
                this.newExerciseData.suggestedSets.splice(index, 1);
            }
        },

        starHover: function(hover, star) {
            if (hover) {
                for (let i = 0; i <= star; i++) {
                    this.stars[i].icon = "mdi-star";
                } 
            } else {
                for (let i = 0; i <= star; i++) {
                    if (!this.stars[i].clicked) {
                        this.stars[i].icon = "mdi-star-outline";
                    }
                }
            }
        },

        starClick: function(star) {
            for (let i = 0; i <= star; i++) {
                this.stars[i].icon = "mdi-star";
                this.stars[i].color = "yellow darken-2"
                this.stars[i].clicked = true;
            }

            for (let i = star + 1; i < 5; i ++) {
                this.stars[i].icon = "mdi-star-outline";
                this.stars[i].color = "";
                this.stars[i].clicked = false;
            }
            
            this.newExerciseData.difficulty = star + 1;
            document.activeElement.blur();
        },

        updateDescription: function(t) {
            this.newExerciseData.description = t;
        },

        updateMgs: function(mg) {
            this.exerciseForm.muscleGroups = mg;
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
<template>
    <v-container>  
        <v-row align="center" justify="center">
            <v-col cols="12" sm="10">
                <h1>{{ workout.name }}</h1>
            </v-col>
            <v-col cols="12" sm="2">
                <p class="timeString">{{ timeString }}</p>
            </v-col>
        </v-row>

        <div id="sortableContainer">
            <v-list-group :value="true" active-class="activeListGroup" v-for="(exercise, exerciseIndex) in exercises" :key="exercise.id">
                <template v-slot:activator>
                    <v-list-item-title><span style="margin-right: 5px;"><v-icon class="sortableHandle">mdi-drag-horizontal-variant</v-icon></span><span style="vertical-align:middle;">{{ exercise.name }}</span></v-list-item-title>
                </template>

                <v-list-item>
                    <v-spacer/>
                    <v-col cols="12" sm="4" align="center">
                        <span><b>Previous</b></span>
                    </v-col>
                    <v-col cols="12" sm="3" align="center">
                        <span><b>Kgs</b></span>
                    </v-col>
                    <v-col cols="12" sm="3" align="center">
                        <span><b>Amount</b></span>
                    </v-col>
                    <v-spacer/>
                </v-list-item>
                
                <v-list-item v-for="(set, setIndex) in exercise.sets" :key="setIndex">
                    <v-row align="center" justify="center">
                        <v-col cols="12" sm="1">
                            <span><b>{{ setIndex + 1 }}</b></span>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <div align="center"><em>{{ previousExercises[exerciseIndex].sets[setIndex].kg }} kg x {{ previousExercises[exerciseIndex].sets[setIndex].measureAmount }}</em></div>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <v-text-field :rules=[rules.isNumber] v-model="set.kg" label="kg"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <div v-if="set.measureBy === 'measureAmount'">
                                <v-text-field :rules=[rules.isNumber] v-model="set.measureAmount" :label="set.measureBy"></v-text-field>
                            </div>
                            <div v-else>
                                <v-text-field :rules=[rules.isNumber] v-model="set.measureAmount" :label="set.measureBy">
                                    <v-icon v-if="set.timer" slot="append" @click="toggleTimer(set)">{{ set.timer.interval ? 'mdi-stop' : 'mdi-clock-outline' }}</v-icon>
                                </v-text-field>
                            </div>
                        </v-col>
                        <v-spacer/>
                        <v-col cols="12" sm="1">
                            <v-checkbox v-model="set.completed" color="success" />
                        </v-col>
                        <v-spacer/>
                    </v-row>
                </v-list-item>

                <v-list-item>
                    <!-- Add Set -->
                    <v-spacer/>
                    <v-col align="center" cols="12" sm="6">
                        <v-btn style="margin-right:5px;" @click="removeSet(exercise.sets)" small>Remove Set</v-btn>
                        <v-btn @click="addSet(exercise)" small>Add Set</v-btn>
                    </v-col>
                    <v-spacer/>
                </v-list-item>
            </v-list-group>
        </div>

        <v-row>
            <v-spacer/>
            <v-col cols="12" sm="6" align="center" style="margin:10px;">
                <v-btn @click.stop="cancellingDialogue = true" style="margin-right: 5px;">Cancel</v-btn>
                <v-btn @click="finishWorkout" color="success" :loading="isFinishing">Finish</v-btn>
            </v-col>
            <v-spacer/>
        </v-row>

        <v-dialog v-model="finishingDialogue" persistent max-width="600">
            <v-card>
                <v-card-title>Congratulations!</v-card-title>
                <div>
                    <v-container>
                        <v-form @submit.prevent="uploadWorkout">
                            <p>Would you like to save this Burn under a new name?</p> 
                            <p><em>(Names must be unique to appear seperately in New Burn)</em></p>
                            <v-text-field label="Burn Name" v-model="workout.name" clearable></v-text-field>
                        </v-form>
                    </v-container>
                </div>
                <v-card-actions>
                    <v-spacer/>
                    <v-btn color="error" text @click="cancelUpload">Cancel</v-btn>
                    <v-btn color="blue darken-1" text :loading="isUploading" @click="uploadWorkout">Finish</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="cancellingDialogue" persistent max-width="600">
            <v-card>
                <v-card-title>Cancel Workout</v-card-title>
                <v-container>
                    Are you sure you want to cancel workout? All progress will be lost!
                </v-container>
                <v-card-actions>
                    <v-spacer/>
                    <v-btn text @click="cancellingDialogue = false">No, Go Back</v-btn>
                    <v-btn text color="error" @click="cancelWorkout">Yes, I'm Sure</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import { db } from '@/firebase'
import Sortable from 'sortablejs'

export default {
    name: 'WorkoutRecorder',
    props: {
        workoutObj: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            workout: {},
            origWorkoutName: '',
            exercises: [],
            startTime: 0,
            finishTime: 0,
            interval: null,
            timeString: '00:00',
            previousExercises: [],

            // Sortable:
            sortable: null,
            sortableOptions: {
                handle: ".sortableHandle",
                animation: 300,
                onEnd: this.changeOrder
            },

            // Vuetify:
            isFinishing: false,
            isUploading: false,
            finishingDialogue: false,
            cancellingDialogue: false,
            isNew: true,
            rules: {
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },

    mounted: function() {
        this.workout = this.$props.workoutObj.data
        this.origWorkoutName = this.$props.workoutObj.type === "workout" ? this.workout.name : this.workout.workoutName;

        this.workout.exercises.forEach(e => {
            let temp = [];
            let incrementor = 0;
            // Here we format the sets array of objects to be correct.
            if (this.$props.workoutObj.type === "workout") {
                e.suggestedSets.forEach(set => {
                    let data = { measureAmount: set.measureAmount, measureBy: set.measureBy, kg: null, id: incrementor, completed: false }

                    if (data.measureBy === "Time") {
                        data.timer = { interval: null, startTimer: 0 }
                    }
                    temp.push(data);
                    incrementor ++;
                })
            } else {
                e.sets.forEach(set => {
                    set.completed = false;
                    set.id = incrementor;

                    if (set.measureBy === "Time") {
                        set.timer = { interval: null, startTimer: 0 }
                    }

                    temp.push(set);
                    incrementor ++;
                })
            }

            const d = { id: e.id, sets: temp, name: e.name }
            this.exercises.push(d);
            this.previousExercises.push(JSON.parse(JSON.stringify(d)));
        })

        this.startTime = new Date().getTime();

        // Set an interval to run every second.
        this.interval = setInterval(() => {
            this.timerCount();
        }, 1000);

        this.sortable = new Sortable(document.getElementById("sortableContainer"), this.sortableOptions)
    },

    methods: {
        timerCount: function() {
            let now = new Date().getTime();
            let distance = now - this.startTime;

            let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
            let minutes = (Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
            let seconds = (Math.floor((distance % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

            if (!hours) {
                this.timeString = minutes + ":" + seconds;
            } else {
                this.timeString = hours + ":" + minutes + ":" + seconds;
            }
        },

        toggleTimer: function(set) {
            if (!set.timer.interval) {
                set.timer.startTimer = new Date().getTime();
                set.measureAmount = 0;

                set.timer.interval = setInterval(() => {
                    let now = new Date().getTime();
                    let distance = now - set.timer.startTimer;
                    set.measureAmount = Math.floor((distance % (1000 * 60)) / 1000);
                }, 1000)
            } else {
                if (set.timer) {
                    clearInterval(set.timer.interval);
                    set.timer.interval = null;
                }
            }
        },

        addSet: function(exercise) {
            let sets = exercise.sets;
            const previousExercisesIndex = this.previousExercises.findIndex(x => x.id === exercise.id);
            const id = sets[sets.length - 1].id + 1;
            let newSet = sets[sets.length - 1];

            // Hack so that the new sets have no reference to each other.
            let d = JSON.parse(JSON.stringify(newSet));

            d.id = id;
            d.completed = false;
            sets.push(d);

            if (sets.length - 1 >= this.previousExercises[previousExercisesIndex].sets.length) {
                let p = JSON.parse(JSON.stringify(newSet));
                p.kg = 0;
                p.measureAmount = 0;
                this.previousExercises[previousExercisesIndex].sets.push(p);
            }

            if (newSet.measureBy === "Time") {
                sets[sets.length - 1].timer = { interval: null, startTimer: 0 }
            }
        },

        removeSet: function(sets) {
            if (sets.length > 1) {
                sets.pop();
                console.log(this.previousExercises[0].sets.length);
            }
        },

        finishWorkout: function() {
            this.isFinishing = true;
            this.finishTime = new Date().getTime();

            // First see if the user has done this workout before.
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("recentWorkouts").where("id", "==", this.workout.id).get().then(workoutSnapshot => {
                if (workoutSnapshot.size > 0) {
                    // If so, user has done this before.
                    // TODO: Check for differences between this workout and previous.
                    // and only prompt for change if this is new.
                    this.isNew = false;
                } else {
                    // Else this is new.
                    this.isNew = true;
                }

                console.log(this.isNew);
                this.finishingDialogue = true;
            })
        },

        uploadWorkout: function() {
            this.isUploading = true;

            this.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    if (set.measureBy === "Time") {
                        if (set.timer.interval) {
                            // If active interval (i.e. timing for this set).
                            clearInterval(set.timer.interval);
                            set.timer.interval = null;
                        }

                        delete set.timer;
                    }

                    delete set.id;
                    delete set.completed;

                    if (set.kg === null) {
                        set.kg = 0;
                    }

                    set.kg = Number(set.kg);
                    set.measureAmount = Number(set.measureAmount);
                })
            })

            let payload = { exercises: this.exercises, createdAt: new Date(), id: this.workout.id, name: this.workout.name, workoutName: this.origWorkoutName, duration: this.finishTime - this.startTime }
            console.log("PL", payload);
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("recentWorkouts").add(payload).then(() => {
                console.log("Created");
                this.$router.push("/burn/recent");
            }).catch(e => {
                console.log("Error saving this workout!", e);
            })
        },

        cancelWorkout: function() {
            this.$emit("cancelWorkout");
        },

        cancelUpload: function() {
            this.finishingDialogue = false;
            this.isFinishing = false;
        },

        changeOrder: function(event) {
            if (event.newIndex !== event.oldIndex) {
                this.exercises.splice(event.newIndex, 0, this.exercises.splice(event.oldIndex, 1)[0]);
                this.previousExercises.splice(event.newIndex, 0, this.previousExercises.splice(event.oldIndex, 1)[0]);
            }
        }
    }
}
</script>

<style scoped>
    .v-list-item .activeListGroup {
        color: #FFF !important;
        display: none !important;
    }

    .v-list-item .v-list-item--active {
        color: #fff;
    }

    .timeString {
        vertical-align: middle;
        display: inline;
        line-height: 48px;
    }
</style>
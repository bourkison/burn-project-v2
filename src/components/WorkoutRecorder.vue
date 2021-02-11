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
            <v-list-group :value="true" active-class="activeListGroup" v-for="exercise in exercises" :key="exercise.id">
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
                
                <v-list-item v-for="(set, index) in exercise.sets" :key="index">
                    <v-row align="center" justify="center">
                        <v-col cols="12" sm="1">
                            <span><b>{{ index + 1 }}</b></span>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <div align="center"><em>{{ set.kg }} x {{ set.measoureAmount }}</em></div>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <v-text-field :rules=[rules.isNumber] v-model="set.kg" label="kg"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <div v-if="set.measureBy === 'measoureAmount'">
                                <v-text-field :rules=[rules.isNumber] v-model="set.measoureAmount" :label="set.measureBy"></v-text-field>
                            </div>
                            <div v-else>
                                <v-text-field :rules=[rules.isNumber] v-model="set.measoureAmount" :label="set.measureBy">
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
                        <v-btn @click="addSet(exercise.sets)" small>Add Set</v-btn>
                    </v-col>
                    <v-spacer/>
                </v-list-item>
            </v-list-group>
        </div>

        <v-row>
            <v-spacer/>
            <v-col cols="12" sm="6" align="center">
                <v-btn @click="finishWorkout" color="success" style="margin:10px;" :loading="isFinishing">Finish</v-btn>
            </v-col>
            <v-spacer/>
        </v-row>
    </v-container>
</template>

<script>
import { db } from '../firebase'
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
            exercises: [],
            startTime: 0,
            interval: null,
            timeString: '00:00',
            isFinishing: false,

            // Sortable:
            sortable: null,
            sortableOptions: {
                handle: ".sortableHandle",
                animation: 300,
                onEnd: this.changeOrder
            },

            // Vuetify:
            rules: {
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },

    mounted: function() {
        this.workout = this.$props.workoutObj.data

        this.workout.exercises.forEach(e => {
            let temp = [];
            let incrementor = 0;
            // Normalise the 2 different data sets (from recentWorkouts and workouts)
            if (this.$props.workoutObj.type === "workout") {
                e.suggestedSets.forEach(set => {
                    let data = { measoureAmount: set.measureAmount, measureBy: set.measureBy, kg: null, id: incrementor, completed: false }

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

            this.exercises.push({ id: e.id, sets: temp, name: e.name });
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
                set.measoureAmount = 0;

                set.timer.interval = setInterval(() => {
                    let now = new Date().getTime();
                    let distance = now - set.timer.startTimer;
                    set.measoureAmount = Math.floor((distance % (1000 * 60)) / 1000);
                }, 1000)
            } else {
                if (set.timer) {
                    clearInterval(set.timer.interval);
                    set.timer.interval = null;
                }
            }
        },

        addSet: function(sets) {
            const id = sets[sets.length - 1].id + 1;
            let newSet = sets[sets.length - 1];

            // Hack so that the new sets have no reference to each other.
            let d = JSON.parse(JSON.stringify(newSet));
            d.id = id;
            d.completed = false;

            sets.push(d);

            if (newSet.measureBy === "Time") {
                sets[sets.length - 1].timer = { interval: null, startTimer: 0 }
            }
        },

        finishWorkout: function() {
            console.log(this.exercises);
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

                    if (set.kg === null) {
                        set.kg = 0;
                    }
                })
            })

            let payload = { exercises: this.exercises, createdAt: new Date(), id: this.workout.id, name: this.workout.name }

            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("recentWorkouts").add(payload).then(() => {
                console.log("Created");
                this.$router.push("/");
                // this.$router.go();
            }).catch(e => {
                console.log("Error saving this workout!", e);
            })
        },

        changeOrder: function(event) {
            if (event.newIndex !== event.oldIndex) {
                this.exercises.splice(event.newIndex, 0, this.exercises.splice(event.oldIndex, 1)[0]);
                console.log(this.exercises);
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
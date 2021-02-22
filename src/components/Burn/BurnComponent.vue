<template>
    <v-card outlined class="burnMin">
        <v-container>
            <v-row justify="center" align="center" style="padding:10px">
                <h2>{{ recentWorkout.name }}</h2>
                <v-spacer />
                <em>{{ timeString }}<span v-if="recentWorkout.createdAtText"> | {{ recentWorkout.createdAtText }}</span></em>
            </v-row>
            <!-- <v-expansion-panels style="margin: 15px 0;">
                <v-expansion-panel v-for="exercise in recentWorkout.exercises" :key="exercise.id">
                    <v-expansion-panel-header>{{ exercise.name }}</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <v-sheet align="center">
                            <v-row align="center" justify="center" v-for="(set, index) in exercise.sets" :key="index">
                                <v-col cols="12" sm="3">
                                    {{ set.measureAmount }}
                                </v-col>
                            </v-row>
                        </v-sheet>
                    </v-expansion-panel-content>
                </v-expansion-panel>
            </v-expansion-panels> -->
            <v-container>
                <div align="center">
                <v-row>
                    <v-col cols="12" sm="1"><strong>#</strong></v-col>
                    <v-col cols="12" sm="5"><strong>Name</strong></v-col>
                    <v-col cols="12" sm="3"><strong>Kg</strong></v-col>
                    <v-col cols="12" sm="3"><strong>Reps</strong></v-col>
                </v-row>
                <v-row v-for="exercise in recentWorkout.exercises" :key="exercise.id">
                    <v-col cols="12" sm="1">{{ exercise.sets.length }}</v-col>
                    <v-col cols="12" sm="5"><router-link :to="'/exercises/' + exercise.id">{{ exercise.name }}</router-link></v-col>
                    <v-col cols="12" sm="3">{{ exercise.sets[0].kg }} kgs</v-col>
                    <v-col cols="12" sm="3">{{ exercise.sets[0].measureAmount }}</v-col>
                </v-row>
                </div>
            </v-container>


            <div align="center"><v-btn color="success" @click="restartWorkout"><v-icon>mdi-plus</v-icon>Workout</v-btn></div>
        </v-container>
    </v-card>
</template>

<script>
export default {
    name: 'BurnComponent',
    props: {
        recentWorkout: {
            type: Object,
            required: false
        }
    },

    data() {
        return {
            timeString: ''
        }
    },

    mounted: function() {
        if (this.$props.recentWorkout.duration) {
            let hours = Math.floor((this.$props.recentWorkout.duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
            let minutes = (Math.floor((this.$props.recentWorkout.duration % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
            let seconds = (Math.floor((this.$props.recentWorkout.duration % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

            if (!hours) {
                this.timeString = minutes + ":" + seconds;
            } else {
                this.timeString = hours + ":" + minutes + ":" + seconds;
            }
        } else {
            this.timeString = "00:00"
        }
    },

    methods: {
        restartWorkout: function() {
            this.$router.push({ path: '/burn', query: { rw: this.$props.recentWorkout.rId } })
        }
    }
}
</script>

<style scoped>
    .burnMin {
        margin-bottom: 15px;
    }
</style>
<template>
    <v-card outlined class="burnMin">
        <v-container>
            <v-row justify="center" align="center">
                <v-col cols="12" md="8">
                    <h2>{{ recentWorkout.name }}</h2>
                </v-col>
                <v-col cols="12" md="4" style="text-align: right;">
                    <em>{{ timeString}} | {{ recentWorkout.createdAtText }}</em>
                </v-col>
            </v-row>
            <v-expansion-panels style="margin: 15px 0;">
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
            </v-expansion-panels>

            <div align="center"><v-btn color="success" @click="restartWorkout"><v-icon>mdi-plus</v-icon>Do Again</v-btn></div>
        </v-container>
    </v-card>
</template>

<script>
export default {
    name: 'BurnMin',
    props: {
        recentWorkout: {
            type: Object,
            required: true
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
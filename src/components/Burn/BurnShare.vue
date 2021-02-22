<template>
    <v-card outlined>
        <div v-if="!isLoading">
            <v-container class="text-center">
                <h3 style="margin:10px 0 20px 0;">{{ burn.name }}</h3>
                <v-row>
                    <v-col cols="12" sm="2"><strong>#</strong></v-col>
                    <v-col cols="12" sm="5"><strong>Name</strong></v-col>
                    <v-col cols="12" sm="5"><strong>Best Set</strong></v-col>
                </v-row>
                <v-row v-for="(exercise, index) in burn.exercises" :key="exercise.id">
                    <v-col cols="12" sm="2">{{ exercise.sets.length }}</v-col>
                    <v-col cols="12" sm="5"><router-link :to="'exercises/' + exercise.id">{{ exercise.name }}</router-link></v-col>
                    <v-col cols="12" sm="5">{{ bestSets[index].kg }}kg x {{ bestSets[index].measureAmount }}</v-col>
                </v-row>
            </v-container>
        </div>
        <div v-else align="center"><v-progress-circular indeterminate centered /></div>
    </v-card>
</template>

<script>
import { db } from '@/firebase'

export default {
    name: 'BurnShare',
    props: {
        burnId: {
            type: String,
            required: false
        },
        userId: {
            type: String,
            required: false
        },
        burnObj: {
            type: Object,
            required: false
        }
    },

    data() {
        return {
            isLoading: false,
            burn: {},
            bestSets: []
        }
    },

    mounted: function() {
        if (this.$props.burnId && this.$props.userId) {
            db.collection("users").doc(this.$props.userId).collection("burns").doc(this.$props.burnId).get()
            .then(burnDoc => {
                let data = burnDoc.data();
                data.id = burnDoc.id;
                this.burn = data;
                this.calculateBestSets();
            })
        } else if (this.$props.burnObj) {
            this.burn = this.$props.burnObj;
            this.calculateBestSets();
            console.log(this.bestSets);
        }
    },

    methods: {
        calculateBestSets: function() {
            this.burn.exercises.forEach(exercise => {
                let i = 0;
                let maxSet = 0;
                let maxSetIndex = 0;

                exercise.sets.forEach(set => {
                    let kg = set.kg;
                    let amount = set.measureAmount;
                    let calc;

                    if (kg == 0) {
                        calc = amount;
                    } else {
                        calc = amount * kg;
                    }

                    if (calc >= maxSet) {
                        maxSet = calc;
                        maxSetIndex = i;
                    }

                    i ++;
                })

                this.bestSets.push(exercise.sets[maxSetIndex]);
            })
        }
    }
}
</script>
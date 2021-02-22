<template>
    <v-card>
        <v-container v-if="!isLoading">
            <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" clearable label="Search recent workout..."></v-text-field>
            <div v-if="filteredBurns.length > 0">
                <h2>Recent Workouts</h2>
                <v-list>
                    <v-list-item v-for="burn in filteredBurns" :key="burn.id" @click="selectBurn(burn)">
                        <v-list-item-title>{{ burn.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-card>
</template>

<script>
import { db } from '@/firebase'

export default {
    name: 'BurnSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            burns: []
        }
    },

    mounted: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").orderBy("createdAt", "desc").get()
        .then(burnsSnapshot => {
            // Only push most recent of each workout.
            let uniqueNames = [];
            burnsSnapshot.forEach(recentWorkout => {
                let data = recentWorkout.data();
                if (!uniqueNames.includes(data.name)) {
                    data.id = recentWorkout.id;
                    this.burns.push(data);
                    uniqueNames.push(data.name)
                }
            })

            this.isLoading = false;
        })
    },

    computed: {
        filteredBurns: function() {
            if (this.searchText) {
                return this.burns.filter(recentWorkout => {
                    return recentWorkout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.burns;
            }
        }
    },

    methods: {
        selectBurn: function(id) {
            this.$emit("selectBurn", id);
        }
    }
}
</script>
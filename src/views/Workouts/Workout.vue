<template>
    <v-container class="mainCont" fluid>
        <v-row>
            <v-spacer></v-spacer>
            <v-col cols="12" sm="3" xl="2">
                <v-card>
                    <v-list flat>
                        <v-list-item-group v-model="selection" color="primary">
                            <v-list-item to="/workouts" class="homeListItem">
                                <v-list-item-icon>
                                    <v-icon>mdi-home-outline</v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                    Home
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item to="/workouts/discover">
                                <v-list-item-icon>
                                    <v-icon>mdi-magnify</v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                    Discover Top Workouts
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item to="/workouts/new">
                                <v-list-item-icon>
                                    <v-icon>mdi-weight-lifter</v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                    New Workout
                                </v-list-item-content>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" lg="5" xl="4">
                <router-view></router-view>
            </v-col>
            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268"></v-sheet>
            </v-col>
            <v-spacer></v-spacer>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'Workout',
    data() {
        return {
            isLoading: false,

            // Vuetify: 
            selection: 0
        }
    },
    
    watch: {
        selection: function(n) {
            if (n === undefined) {
                this.selection = 0;
                return;
            }

            if (this.selection != 0) {
                document.querySelector(".homeListItem").classList.remove("v-item--active", "v-list-item--active");
            } else {
                document.querySelector(".homeListItem").classList.add("v-item--active", "v-list-item--active");
            }
        }
    }
}
</script>

<style scoped>
    .mainCont {
        width: 100%;
        max-width: 1400px !important;
    }
</style>
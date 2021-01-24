<template>
    <v-container>
        <v-row>
            <v-spacer></v-spacer>
            <v-col cols="12" sm="2">
                <v-sheet rounded="lg">
                    <v-card >
                        <v-list flat> 
                            <v-list-item-group v-model="selection" color="primary">
                                <v-list-item to="/exercises">
                                    <v-list-item-icon>
                                        <v-icon>mdi-home-outline</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        Home
                                    </v-list-item-content>
                                </v-list-item>
                                <v-list-item to="/exercises/discover">
                                    <v-list-item-icon>
                                        <v-icon>mdi-magnify</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        Discover Top Exercises
                                    </v-list-item-content>
                                </v-list-item>
                                <v-list-item to="/exercises/new">
                                    <v-list-item-icon>
                                        <v-icon>mdi-dumbbell</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        New Exercise
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list>
                    </v-card>
                </v-sheet>
            </v-col>
            <v-col cols="12" sm="6">
                <router-view></router-view>
            </v-col>
            <v-col cols="12" sm="2">
                <v-sheet rounded="lg" min-height="268">
                    <!--  -->
                </v-sheet>
            </v-col>
            <v-spacer></v-spacer>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'Exercise',
    data() {
        return {
            isLoading: false,

            // Vuetify:
            selection: []
        }
    },

    methods: {
        clear: function() {
            this.selection = [];
        }
    }
}
</script>
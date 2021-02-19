<template>
    <v-container class="mainCont" fluid>
        <v-row>
            <v-spacer/>
            <v-col cols="12"  sm="3" xl="2">
                <v-sheet rounded="lg">
                    <v-card >
                        <v-list flat> 
                            <v-list-item-group v-model="selection" color="primary">
                                <v-list-item to="/burn" class="homeListItem">
                                    <v-list-item-icon>
                                        <v-icon>mdi-home-outline</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        New Burn
                                    </v-list-item-content>
                                </v-list-item>
                                <v-list-item to="/burn/recent">
                                    <v-list-item-icon>
                                        <v-icon>mdi-fire</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        Recent Burns
                                    </v-list-item-content>
                                </v-list-item>
                                <v-list-item to="/burn/view">
                                    <v-list-item-icon>
                                        <v-icon>mdi-account</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        People You Follow
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list>
                    </v-card>
                </v-sheet>
            </v-col>
            <v-col cols="12" sm="6" lg="5" xl="4">
                <router-view></router-view>
            </v-col>
            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268">
                    <!--  -->
                </v-sheet>
            </v-col>
            <v-spacer/>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'Burn',

    data() {
        return {
            selection: 0
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
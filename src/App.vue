<template>
    <v-app id="inspire">
        <div v-if="$store.state.userProfile != null">
            <v-app-bar
                app
                flat
            >
                <v-container>
                    <v-row justify="center" align="center">
                        <v-avatar color="grey darken-1" size="40"></v-avatar>
                        
                        <v-btn text to="/">Home</v-btn>
                        <v-menu open-on-hover bottom offset-y>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn text v-if="$store.state.userProfile.loggedIn" v-bind="attrs" v-on="on">Drop Down</v-btn>
                            </template>
                            
                            <v-card>
                                <v-list>
                                    <v-list-item text v-if="$store.state.userProfile.loggedIn" to="/exercises">Exercises</v-list-item>
                                    <v-list-item text v-if="$store.state.userProfile.loggedIn" to="/burn">Burn</v-list-item>
                                    <v-list-item text v-if="$store.state.userProfile.loggedIn" to="/workouts">Workouts</v-list-item>
                                </v-list>
                            </v-card>
                        </v-menu>

                        <v-btn text v-if="$store.state.userProfile.loggedIn" :to="'/' + $store.state.userProfile.docData.username">Profile</v-btn>
                        <v-btn text v-if="$store.state.userProfile.loggedIn" @click="signOut()">Sign Out</v-btn>
                        <v-btn text v-if="!$store.state.userProfile.loggedIn" @click.stop="signInDialog = true">Log In</v-btn>
                        <v-btn text v-if="!$store.state.userProfile.loggedIn" @click.stop="signUpDialog = true">Sign Up</v-btn>

                        <v-spacer></v-spacer>
                        <MainSearch></MainSearch>
                    </v-row>
                </v-container>
                <!-- <v-row>
                <v-col cols="12" sm="3">
                    <MainSearch></MainSearch>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-tabs centered class="ml-n9">
                    <v-tab key="homeTab" to="/">Home</v-tab>
                    <v-tab v-if="$store.state.userProfile.loggedIn" to="/exercises">Exercises</v-tab>
                    <v-tab v-if="$store.state.userProfile.loggedIn" to="/burn">Burn</v-tab>
                    <v-tab v-if="$store.state.userProfile.loggedIn" to="/workouts">Workouts</v-tab>
                    <v-tab v-if="$store.state.userProfile.loggedIn" :to="'/' + $store.state.userProfile.docData.username">Profile</v-tab>
                    <v-tab v-if="$store.state.userProfile.loggedIn" @click="signOut()">Sign Out</v-tab>
                    </v-tabs>
                </v-col>
                <v-col cols="12" sm="3">
                    <v-dialog
                    v-model="signInDialog"
                    persistent
                    max-width="600px"
                    style="overflow:hidden;"
                    v-if="!$store.state.userProfile.loggedIn"
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn dark v-bind="attrs" v-on="on">
                            Log In
                            </v-btn>
                        </template>
                        <LogInForm></LogInForm>
                    </v-dialog>
                    <v-dialog
                        v-model="signUpDialog"
                        persistent
                        max-width="600"
                        v-if="!$store.state.userProfile.loggedIn"
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn dark v-bind="attrs" v-on="on">
                            Sign Up
                            </v-btn>
                        </template>
                        <SignUpForm></SignUpForm>
                    </v-dialog>
                </v-col>
                </v-row> -->
            </v-app-bar>
            <v-main class="lighten-3">
                <router-view></router-view>
            </v-main>
            <v-dialog v-model="signInDialog" persistent max-width="600px" style="overflow:hidden;" v-if="!$store.state.userProfile.loggedIn">
                <LogInForm></LogInForm>
            </v-dialog>
            <v-dialog v-model="signUpDialog" persistent max-width="600" v-if="!$store.state.userProfile.loggedIn">
                <SignUpForm></SignUpForm>
            </v-dialog>
        </div>
        <div v-else>
        <v-app-bar app flat>
        </v-app-bar>
        <v-main class="lighten-3">
            <v-container>
                <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
            </v-container>
        </v-main>
        </div>
    </v-app>
</template>

<script>
import { auth } from './firebase'
import SignUpForm from './components/SignUpForm.vue'
import LogInForm from './components/LogInForm.vue'

import MainSearch from '@/components/Search/MainSearch.vue'

export default {
components: { SignUpForm, LogInForm, MainSearch },
data() {
    return {
    signUpDialog: false,
    signInDialog: false,

    isLoading: false,
    }
},

methods: {
    signOut: function() {
    auth.signOut();
    this.$router.push("/");
    }
}
}
</script>

<style scoped>
.ml-n9 {
    margin-left: 0 !important;
}
</style>
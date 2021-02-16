<template>
    <v-app id="inspire">
        <div v-if="$store.state.userProfile != null">
        <v-app-bar
            app
            flat
        >
            <v-row>
            <v-col cols="12" sm="3">
                <v-avatar
                size="32"
                ></v-avatar>
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
            </v-row>
        </v-app-bar>
        <v-main class="lighten-3">
            <router-view></router-view>
        </v-main>
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

export default {
  components: { SignUpForm, LogInForm },
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
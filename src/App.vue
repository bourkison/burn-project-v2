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
                <v-card>
                  <v-form @submit.prevent="login">
                    <LogInForm @callLogin="callLogin" :signInForm="signInForm"></LogInForm>
                  </v-form>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="error" text @click="signInDialog = false">Close</v-btn>
                    <v-btn color="blue darken-1" text @click="login" :loading="isLoading">Log In</v-btn>
                  </v-card-actions>
                </v-card>
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
              <v-card>
                <SignUpForm @callSignUp="callSignUp" :signUpForm="signUpForm"></SignUpForm>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="error" text @click="signUpDialog = false">Close</v-btn>
                  <v-btn color="blue darken-1" text @click="signUp" :loading="isLoading">Sign Up</v-btn>
                </v-card-actions>
              </v-card> 
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
import { auth, storage, userCollection } from './firebase'
import SignUpForm from './components/SignUpForm.vue'
import LogInForm from './components/LogInForm.vue'

export default {
  components: { SignUpForm, LogInForm },
  data() {
    return {
      signUpDialog: false,
      signInDialog: false,
      signUpForm: {
        email: '',
        username: '',
        password: '',
        confPassword: '',
        firstName: '',
        surname: '',
        dob: null,
        height: null,
        heightUnit: 'cm',
        weight: null,
        weightUnit: 'kg',
        country: "United States"
      },

      signInForm: {
        email: '',
        password: ''
      },

      isLoading: false,
    }
  },

  methods: {
    signUp: function() {
      this.isLoading = true;

      let userPayload = {
          username: this.signUpForm.username,
          firstName: this.signUpForm.firstName,
          surname: this.signUpForm.surname,
          dob: this.signUpForm.dob,
          height: this.signUpForm.height,
          weight: this.signUpForm.weight,
          country: this.signUpForm.country
      }


      auth.createUserWithEmailAndPassword(this.signUpForm.email, this.signUpForm.password).then(user => {
          // User now created in Auth system. We now need to create User in Firestore.
          userCollection.doc(user.user.uid).set(userPayload).then(() => {
                let imageRef = storage.ref("users/" + user.user.uid + "/pp/" + Number(new Date()));

                imageRef.put(this.signUpForm.profilePhotoFile).then(() => {
                  imageRef.getDownloadURL().then(profilePhotoUrl => {
                    userCollection.doc(user.user.uid).update({ profilePhotoUrl }).then(() => {
                      this.isLoading = false;
                      this.signUpDialog = false;
                    }).catch(e => {
                      this.errorMessage = "Error assigning image URL to user." + e;
                      console.log(this.errorMessage);
                    })
                  }).catch(e => {
                    this.errorMessage = "Error downloading image URL." + e;
                    console.log(this.errorMessage);
                  })
                }).catch(e => {
                  this.errorMessage = "Error uploading image." + e;
                  console.log(this.errorMessage);
                })                
            }).catch(e => {
                // TODO: Delete newly created user as not created properly.
                this.errorMessage = "User signed up but error creating user doc." + e;
                console.log(this.errorMessage);
                this.isLoading = false;
            })
      }).catch(e => {
          this.errorMessage = "Error creating user: " + e;
          console.log(this.errorMessage);
          this.isLoading = false;
      })
    },

    login: function() {
      this.isLoading = true;
      auth.signInWithEmailAndPassword(this.signInForm.email, this.signInForm.password).then(() => {
        this.signInDialog = false;
        this.isLoading = false;
      }).catch(e => {
        this.errorMEssage = "Error signing in: " + e;
        this.isLoading = false;
      });
    },

    callLogin: function() {
      this.login();
    },

    callSignUp: function() {
      this.signUp();
    },

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
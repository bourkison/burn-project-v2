<template>
    <v-container>
        <v-row max-width="968" width="100%" align="center">
            <v-sheet rounded="lg" max-width="968" width="100%" outlined class="loginSheet">
                <v-container>
                    <h1 class="text-center">Login</h1>
                    <v-form @submit.prevent="signIn()" ref="form">
                        <v-text-field 
                            v-model="signInForm.email" 
                            label="Email" 
                            :rules="[rules.required]" >
                        </v-text-field
                        ><v-text-field 
                            v-model="signInForm.password" 
                            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[rules.required]"
                            :type="showPassword ? 'text' : 'password'"
                            label="Password"
                            class="input-group--focused"
                            @click:append="showPassword = !showPassword"
                        ></v-text-field>
                        <div class="text-center"><v-btn type="submit" v-bind:loading="isLoading" :disabled="isLoading">Sign In!</v-btn></div>
                    </v-form>
                </v-container>
            </v-sheet>
        </v-row>
    </v-container>
</template>

<script>
import { auth } from '@/firebase';


export default {
    data() {
        return {
            signInForm: {
                email: '',
                password: ''
            },
            errorMessage: '',
            // Vuetify:
            isLoading: false,
            showPassword: false,
            rules: {
                required: value => !!value || 'Required.',
                emailMatch: () => (`The email and password you entered don't match`)
            }
        }
    },

    methods: {
        signIn: function() {
            this.isLoading = true;

            auth.signInWithEmailAndPassword(this.signInForm.email, this.signInForm.password).then().catch(e => {
                this.errorMEssage = "Error signing in: " + e;
                // this.isLoading = false;
            });
        }
    },

}
</script>

<style scoped>
    .container {
        margin-top: 40px;
    }

    .loginSheet {
        margin: 0 auto;
    }


</style>
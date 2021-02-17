<template>
    <v-card>
        <v-container>
            <v-form @submit.prevent="login">
                <h1 class="text-center">Sign In</h1>
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
                <input type="submit" style="visibility:hidden;"/>
            </v-form>
        </v-container>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="signInDialog = false">Close</v-btn>
            <v-btn color="blue darken-1" text @click="login" :loading="isLoading">Log In</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import { auth } from '@/firebase'

export default {
    name: 'LogInForm',
    data() {
        return {
            isLoading: false,

            signInForm: {
                email: '',
                password: ''
            },

            showPassword: false,
            rules: {
                required: value => !!value || 'Required.',
                emailMatch: () => (`The email and password you entered don't match`)
            }
        }
    },

    methods: {
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
    }
}
</script>
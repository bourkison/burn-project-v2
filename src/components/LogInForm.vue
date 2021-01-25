<template>
    <v-container>
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
    </v-container>
</template>

<script>
export default {
    name: 'LogInForm',
    props: {
        signInForm: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            showPassword: false,
            rules: {
                required: value => !!value || 'Required.',
                emailMatch: () => (`The email and password you entered don't match`)
            }
        }
    }
}
</script>
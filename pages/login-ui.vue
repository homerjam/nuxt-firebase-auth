<script>
import * as firebase from 'firebase/app';
import 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

export default {
  auth: false,
  data() {
    return {
      ui: null,
    };
  },
  mounted() {
    if (this.ui) {
      return;
    }

    this.ui = new firebaseui.auth.AuthUI(firebase.auth());

    this.ui.start('#firebaseui-auth-container', {
      signInFlow: 'popup',
      signInSuccessUrl: '/',
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: {
            prompt: 'select_account',
          },
        },
      ],
    });
  },
};
</script>

<template>
  <div class="login-ui">
    <h1>Login UI</h1>
    <br />
    <div id="firebaseui-auth-container"></div>
  </div>
</template>

<style>
.login-ui {
  padding: 2rem;
}
</style>

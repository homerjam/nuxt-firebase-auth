import type { SchemeOptions } from '@nuxtjs/auth-next/dist';
import BaseScheme from '@nuxtjs/auth-next/dist/schemes/_scheme';
import * as firebase from 'firebase/app';
import 'firebase/auth';

const DEFAULTS: SchemeOptions = {
  name: 'firebase',
  token: {
    type: '',
    maxAge: 60 * 30,
    global: true,
  },
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: '',
  },
};

export default class FirebaseScheme extends BaseScheme<typeof DEFAULTS> {
  firebaseApp: firebase.app.App;

  constructor($auth, options, ...defaults) {
    super($auth, options, ...defaults, DEFAULTS);

    this.firebaseApp = firebase.initializeApp(this.options.firebaseConfig);
  }

  _checkStatus() {
    this.$auth.token.sync();

    const tokenStatus = this.$auth.token.status();

    if (tokenStatus.expired()) {
      this.$auth.reset();
    }
  }

  async _updateUser(authUser) {
    const idTokenResult = await authUser.getIdTokenResult();

    const user = {
      ...idTokenResult.claims,
      id_token: idTokenResult.token,
    };

    this.$auth.setUser(user);

    this.$auth.token.set(idTokenResult.token);

    return user;
  }

  mounted() {
    this._checkStatus();

    return this.$auth.fetchUserOnce();
  }

  check() {
    return !!this.$auth.token.get();
  }

  async login(provider, { email = '', password = '', reset = true } = {}) {
    if (reset) {
      this.$auth.reset();
    }

    let authResult;

    if (provider === 'password') {
      authResult = await this.firebaseApp
        .auth()
        .signInWithEmailAndPassword(email, password);
    } else {
      let authProvider;

      if (provider === 'google') {
        authProvider = new firebase.auth.GoogleAuthProvider();
      }

      authResult = await this.firebaseApp.auth().signInWithPopup(authProvider);
    }

    const user = await this._updateUser(authResult.user);

    window.location.replace(this.$auth.options.redirect.home);

    return user;
  }

  fetchUser() {
    return new Promise((resolve) => {
      const unsubscribe = this.firebaseApp
        .auth()
        .onAuthStateChanged(async (authUser) => {
          unsubscribe();

          let user;

          if (!authUser) {
            this.reset();
          } else {
            user = await this._updateUser(authUser);
          }

          resolve(user);
        });
    });
  }

  async logout() {
    await this.firebaseApp.auth().signOut();

    window.location.replace(this.$auth.options.redirect.logout);

    return this.$auth.reset();
  }

  reset() {
    this.$auth.setUser(false);
    this.$auth.token.reset();
  }
}

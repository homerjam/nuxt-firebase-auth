import type { SchemeOptions } from '@nuxtjs/auth-next/dist';
import BaseScheme from '@nuxtjs/auth-next/dist/schemes/_scheme';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import jwt from 'jsonwebtoken';
import memoizer from 'lru-memoizer';
import fetch from 'node-fetch';

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
  firebaseJwt: {
    publicKeysUrl:
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    issuer: 'https://securetoken.google.com/',
  },
};

export default class FirebaseScheme extends BaseScheme<typeof DEFAULTS> {
  firebaseApp: firebase.app.App;

  constructor($auth, options, ...defaults) {
    super($auth, options, ...defaults, DEFAULTS);

    if (!firebase.apps.length) {
      this.firebaseApp = firebase.initializeApp(this.options.firebaseConfig);

      // @ts-ignore
      this.firebaseApp._getSigningKey = memoizer({
        // @ts-ignore
        load: (kid, callback) => {
          fetch(this.options.firebaseJwt.publicKeysUrl)
            .then((result) => result.json())
            .then((result) => {
              callback(null, result[kid]);
            })
            .catch(callback);
        },
        // @ts-ignore
        hash: (kid) => kid,
        maxAge: 1000 * 60 * 10,
        max: 5,
      });
    } else {
      this.firebaseApp = firebase.app();
    }
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

  _serverFetchUser() {
    return new Promise((resolve) => {
      const token = this.$auth.token.get();

      if (!token) {
        this.reset();
        resolve();
        return;
      }

      jwt.verify(
        token,
        (header, callback) => {
          // @ts-ignore
          this.firebaseApp._getSigningKey(header.kid, (error, key) => {
            if (error) {
              callback(error);
              return;
            }
            callback(null, key);
          });
        },
        {
          issuer:
            this.options.firebaseJwt.issuer +
            this.options.firebaseConfig.projectId,
        },
        (error, decoded) => {
          if (error) {
            resolve();
            return;
          }

          const user = {
            ...decoded,
            id_token: token,
          };

          this.$auth.setUser(user);

          resolve(user);
        }
      );
    });
  }

  _clientFetchUser() {
    return new Promise((resolve) => {
      const unsubscribe = this.firebaseApp
        .auth()
        .onAuthStateChanged(async (authUser) => {
          unsubscribe();

          if (!authUser) {
            this.reset();
            resolve();
            return;
          }

          const user = await this._updateUser(authUser);

          resolve(user);
        });
    });
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

  async fetchUser() {
    if (process.server) {
      return this._serverFetchUser();
    }

    if (process.client) {
      return this._clientFetchUser();
    }
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

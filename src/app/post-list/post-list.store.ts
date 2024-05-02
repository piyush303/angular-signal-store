import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, map, pipe, switchMap, tap } from 'rxjs';
import { PostListService } from './post-list.service';

enum LoadingState {
  INIT = 'INIT',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
}

export interface PostDetails {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface PostListState {
  postDetails: PostDetails[];
  loadingState: LoadingState;
  errorMessage: string;
}

const INITIAL_STATE: PostListState = {
  postDetails: [],
  loadingState: LoadingState.INIT,
  errorMessage: '',
};

export const PostListStore = signalStore(
  withState(INITIAL_STATE),
  withComputed((store) => ({
    isLoading: computed(() => store.loadingState() === LoadingState.LOADING),
  })),
  withMethods((store, postListService = inject(PostListService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, { loadingState: LoadingState.LOADING });
        }),
        switchMap(() => {
          return postListService.get().pipe(
            map((response: any) => {
              return patchState(store, {
                loadingState: LoadingState.LOADED,
                postDetails: response,
              });
            }),
            catchError((err) => {
              patchState(store, { errorMessage: err.message });
              return EMPTY;
            })
          );
        })
      )
    ),
  })),
  withHooks({
    onInit(store) {
      store.load();
    },
  })
);

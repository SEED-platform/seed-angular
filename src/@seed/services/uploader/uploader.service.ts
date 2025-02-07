import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
// import type { Observable } from 'rxjs'
// import { concatMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class UploaderService {
  private _httpClient = inject(HttpClient)

  checkProgressLoop({
    progressKey,
    offset,
    multiplier,
    successFn,
    errorFn,
  }: {
    progressKey: string;
    offset: number;
    multiplier: number;
    successFn: () => void;
    errorFn: () => void;
    progressBarObj: unknown;
  }): void {
  // checkProgressLoop({ progress_key, offsett, multiplier, success_fn, failire_fn, progress_bar_obj}): void {
    successFn()
    errorFn()
    // this.checkProgress(progressKey).pipe(
    //   concatMap((data) => {
    //     console.log('data', data)
    //   }),
    // )
    console.log('checkProgressLoop', progressKey, offset, multiplier)
  }

  checkProgress(progressKey: string): void {
    console.log('checkProgress', progressKey)
    // const url = `/api/v3/progress/${progressKey}/`
    // return this._httpClient.get(url)<ProgressResponse>.pipe(
    //   map((response) => { response.data })
    // )
  }
}

// this.fetchData().pipe(
//   concatMap(data => this.processData(data)),
//   concatMap(processedData => this.saveData(processedData))
// ).subscribe({
//   next: result => console.log("Final result:", result),
//   error: err => console.error("Error:", err)
// });

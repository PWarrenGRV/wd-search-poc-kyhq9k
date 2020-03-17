import { Component, OnInit } from '@angular/core';
import { SearchApiService } from './search-api.service';
import { BehaviorSubject, Observable, EMPTY, combineLatest } from 'rxjs';
import { debounceTime, switchMap, map, shareReplay } from 'rxjs/operators';

enum SearchRowType {
  Trainer = 'Trainer',
  Dog = 'Dog',
  Unknown = 'Unknown'
}

interface SearchRowCommon {
  type: SearchRowType;
  _source: any;
}
interface SearchRowTrainer extends SearchRowCommon {
  type: SearchRowType.Trainer;
  fullName: string;
  email: string;
  address: string;
}

interface SearchRowDog extends SearchRowCommon {
  type: SearchRowType.Dog;
  name: string;
  trainerName: string;
  id: number;
}

interface SearchRowUnknown extends SearchRowCommon {
  type: SearchRowType.Unknown;
}

export type SearchRow = SearchRowTrainer | SearchRowDog | SearchRowUnknown;

interface SearchState {
  query?: string;
  onlyRacing: boolean;
  currentPage: number;
}

interface SearchResult {
  from: number;
  hits: number;
  rows: SearchRow;
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  Result = SearchRowType;

  constructor(private api: SearchApiService) {}

  private readonly _pageSize = 10;
  private _searchState$ = new BehaviorSubject<SearchState>({
    currentPage: 0,
    onlyRacing: true
  });

  get onlyRacing(): boolean {
    return this._searchState$.value.onlyRacing;
  }

  get currentPage(): number {
    return this._searchState$.value.currentPage;
  }

  // TODO: combine together.
  searchResult$: Observable<SearchRow[]>;
  countPages$: Observable<number>;

  ngOnInit() {
    const apiResult$ = this._searchState$.pipe(
      debounceTime(300),
      switchMap(({ query, onlyRacing, currentPage }) => {
        if (query) {
          return this.api.search(
            { query, onlyRacing },
            this._pageSize * currentPage,
            this._pageSize
          );
        } else {
          return EMPTY;
        }
      }),
      shareReplay(1)
    );

    // const _searchResult$: Observable<SearchResult> = apiResult$.pipe(
    //   map(result => {
    //     return { hits: result.hits.total.value, from:  };
    //   })
    // );

    this.searchResult$ = apiResult$.pipe(
      map(result =>
        result.hits.hits.map(({ _source: o, _index }) => {
          if (_index === 'reindexed-v7-person') {
            return {
              type: SearchRowType.Trainer,
              _source: o,
              fullName: o.fullName,
              address: `${o.street}, ${o.suburb}, ${o.state} ${o.postcode}`
            };
          } else if (_index === 'reindexed-v7-dog') {
            return {
              type: SearchRowType.Dog,
              _source: o,
              name: o.name,
              trainerName: o.trainerName,
              id: o.id
            };
          } else {
            return {
              type: SearchRowType.Unknown,
              _source: o
            };
          }
        })
      )
    );
    this.countPages$ = apiResult$.pipe(
      map(result => Math.ceil(result.hits.total.value / this._pageSize))
    );
  }

  onOnlyRacingChange(onlyRacing: boolean) {
    this.update({
      currentPage: 0,
      onlyRacing
    });
  }

  onSearchChange(query: string) {
    this.update({
      currentPage: 0,
      query
    });
  }

  onPageChange(currentPage: number) {
    this.update({
      currentPage
    });
  }

  private update(changes: Partial<SearchState>) {
    this._searchState$.next({
      ...this._searchState$.value,
      ...changes
    });
  }

  dogUrl(row: any) {
    return `https://fasttrack.grv.org.au/Dog/Details/${row.id}`;
  }

  trainerUrl(row: any) {
    // TODO: Link to this app but search for all dogs under a trainer
    return `https://fasttrack.grv.org.au/Dog/Trainer/${row.id}`;
  }
}

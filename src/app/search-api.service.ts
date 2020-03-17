import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {
  constructor(private http: HttpClient) {}

  search(
    { query, onlyRacing }: { query: string; onlyRacing: boolean },
    from = 0,
    size = 10
  ): Observable<any> {
    return this.http.post(
      `https://2f6447ea1f8546c38f5a8f631be02e44.ap-southeast-2.aws.found.io:9243/person,dog/_search`,
      {
        from,
        size,
        query: queryAll(query, onlyRacing)
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + btoa('fasttrack-user:fC74dCB7')
        }
      }
    );
  }
}

function queryAll(query: string, onlyRacing: boolean) {
  return {
    bool: {
      should: [
        queryIndex('reindexed-v7-dog', queryDog(query, onlyRacing)),
        queryIndex('reindexed-v7-person', queryPerson(query))
      ]
    }
  };
}

function queryIndex(name: string, inner: any) {
  return {
    bool: {
      must: [
        {
          term: {
            _index: name
          }
        },
        inner
      ]
    }
  };
}

function queryPerson(query: string) {
  return {
    bool: {
      filter: {
        term: {
          role: {
            value: 'publictrainer'
          }
        }
      },
      must: {
        match: {
          fullName: {
            query
          }
        }
      }
    }
  };
}

function queryDog(query: string, onlyRacing: boolean) {
  if (onlyRacing) {
    return {
      bool: {
        filter: {
          term: {
            status: {
              value: 'racing'
            }
          }
        },
        must: queryDog(query, false)
      }
    };
  } else {
    return {
      multi_match: {
        query: query,
        fields: ['name', 'trainerName'],
        type: 'most_fields'
      }
    };
  }
}

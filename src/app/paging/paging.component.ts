import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-paging',
  templateUrl: './paging.component.html',
  styleUrls: ['./paging.component.css']
})
export class PagingComponent {
  @Input()
  page = 0; // TODO: rename to "index"

  @Input()
  count = 0;

  @Output()
  pageChange = new EventEmitter<number>();

  onPrev() {
    if (!this.isFirst) {
      this.pageChange.emit(this.page - 1);
    }
  }

  onNext() {
    if (!this.isLast) {
      this.pageChange.emit(this.page + 1);
    }
  }

  get isFirst(): boolean {
    return this.page <= 0;
  }

  get isLast(): boolean {
    return this.page >= this.count - 1;
  }
}

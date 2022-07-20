
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { LiveAnnouncer } from "@angular/cdk/a11y";
import { PlanningService } from '../service/planning.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';


export interface FieldsElement {
  name: string;
  title : string;
  position: number;
  prompt: string;
  isDayField: boolean;
  hideField: boolean;
  sticky: boolean;
  style: {};
}

export class Group {
  level = 0;
  parent!: Group;
  expanded = true;
  totalCounts = 0;
  [key: string]: any;

  get visible(): boolean {
    return !this.parent || (this.parent.visible && this.parent.expanded);
  }
}


@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit, AfterViewInit  {

  public dataSource = new MatTableDataSource<any | Group>([]);
  // dataSource = [new MatTableDataSource(FIELD_DATA)];
  listGridFields : FieldsElement[] = [];
  listGridFieldsSelected : FieldsElement[] = [];
  allData: any[] = [];
  groupByColumns: string[] = [];
  displayedColumns: string[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatMenuTrigger, {static: true}) contextMenu!: MatMenuTrigger;

  
  // dataElement = [];
  constructor(private planningService : PlanningService, private _liveAnnouncer: LiveAnnouncer) { 
    this.listGridFields = this.planningService.getListGridFields();
    this.listGridFieldsSelected = this.listGridFields.filter(p => !p.isDayField);
    // this.dataElement = this.planningService.getDataElement();
    // this.displayedColumns = this.planningService.getListOfDisplayColumns();
    this.displayedColumns = this.planningService.getListOfDisplayColumns().map(column => column);
    this.groupByColumns = ['TEAM_PARENT_LABEL'];
  }  

  contextMenuPosition = { x: '0px', y: '0px' };

  onContextMenu(event: MouseEvent, record: any, cellElement: any) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    const item : Item = {
      record : record,
      cellElement : cellElement
    };
    this.contextMenu.menuData = { 'item': item};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  ngOnInit(): void {

    this.dataSource = new MatTableDataSource(this.planningService.getDataElement());

    this.allData = this.dataSource.data;
    this.dataSource.data = this.addGroups(this.allData, this.groupByColumns);
    this.dataSource.filterPredicate = this.customFilterPredicate.bind(this);
    this.dataSource.filter = performance.now().toString();
  }

  getPlanningComponent () {
    
      this.dataSource = new MatTableDataSource(this.planningService.getDataElementGlobal());
      this.allData = this.dataSource.data;
      this.dataSource.data = this.allData;

      this.dataSource.data = this.addGroups(this.allData, this.groupByColumns);
      this.dataSource.filterPredicate = this.customFilterPredicate.bind(this);
      this.dataSource.filter = performance.now().toString();
      this.dataSource.sort = this.sort;
  } 
  
  getFullStyle(record : {[key: string]: string} , filedName: String): any {
    
    let myStyles = {
      // backgroundColor: 'ivory',
      backgroundImage: 'url(../../assets/images/icons/sans_PA_exp.png)',
      backgroundSize:'40%',
      backgroundPosition:'center center',
      backgroundRepeat:'no-repeat',
      borderBottom:'1px solid #A0A0A0',
      borderTop:'1px solid white',
      borderRight:'1px solid #A0A0A0',
      color:'black',
      fontFamily:'Arial,Verdana,sans-serif',
      fontSize:'10px !important',
      height:'22px',
    };


    if (filedName.indexOf("DAY") !== -1) {
      // type fullName = ("FULL_STYLE" + filedName);
      let fullName = "FULL_STYLE" + filedName.toString();
      if (fullName.toString() in record) {
        let fullStyle = record[fullName];

        let keyValuePairs = fullStyle.slice(1, -1).split(/\s*,\s*/).map(chunk => chunk.split(","));  //remove first and last character and split with optional spaces around the comma
        let mapStyle: any = {};
        keyValuePairs.forEach(obj => {
          let rec = obj[0].split(":");  //split key=value

          mapStyle[rec[0]] = rec[1];
        });
        return mapStyle;
      }
    }

    return "";
  }

  groupBy(event: { stopPropagation: () => void; }, column: FieldsElement) {
    event.stopPropagation();
    this.checkGroupByColumn(column.name, true);
    this.dataSource.data = this.addGroups(this.allData, this.groupByColumns);
    this.dataSource.filter = performance.now().toString();
  }

  checkGroupByColumn(field: string, add: boolean ) {
    this.groupByColumns = [];
    if (add) {
      this.groupByColumns.push(field);
    }

    // let found = null;
    // for (const column of this.groupByColumns) {
    //   if (column === field) {
    //     found = this.groupByColumns.indexOf(column, 0);
    //   }
    // }
    // if (found != null && found >= 0) {
    //   if (!add) {
    //     this.groupByColumns.splice(found, 1);
    //   }
    // } else {
    //   if ( add ) {
    //     this.groupByColumns.push(field);
    //   }
    // }
  }

  unGroupBy(event: { stopPropagation: () => void; }, column: FieldsElement) {
    event.stopPropagation();
    this.checkGroupByColumn(column.name, false);
    this.dataSource.data = this.addGroups(this.allData, this.groupByColumns);
    this.dataSource.filter = performance.now().toString();
  }

  onColumnSelect(event: MatCheckboxChange, column: FieldsElement) {
    this.listGridFieldsSelected.forEach(field => {
      if (column.name == field.name) {
        field.hideField = !event.checked;
      }
    });

    // Reindex displayColumn
    const selectedColumns: string[] = []
    this.listGridFields.forEach(field => {
      if (column.name == field.name) {
        field.hideField = !event.checked;
      }
      if (!field.hideField) {
        selectedColumns.push(field.name);
      }
    });
    this.displayedColumns = selectedColumns.map(column => column);
  }

  // below is for grid row grouping
  customFilterPredicate(data: any | Group, filter: string): boolean {
    return (data instanceof Group) ? data.visible : this.getDataRowVisible(data);
    return true;
  }

  getDataRowVisible(data: any | Group): boolean {
    const groupRows = this.dataSource.data.filter(
      row => {
        if (!(row instanceof Group)) {
          return false;
        }
        let match = true;
        this.groupByColumns.forEach(column => {
          if (!row[column as keyof Group] || !data[column] || row[column as keyof Group] !== data[column]) {
            match = false;
          }
        });
        return match;
      }
    );

    if (groupRows.length === 0) {
      return true;
    }
    const parent = groupRows[0] as Group;
    return parent.visible && parent.expanded;
  }

  groupHeaderClick(row: { expanded: boolean; }) {
    row.expanded = !row.expanded;
    this.dataSource.filter = performance.now().toString();  // bug here need to fix
  }

  addGroups(data: any[], groupByColumns: string[]): any[] {
    const rootGroup = new Group();
    rootGroup.expanded = true;
    return this.getSublevel(data, 0, groupByColumns, rootGroup);
  }

  getSublevel(data: any[], level: number, groupByColumns: string[], parent: Group): any[] {
    if (level >= groupByColumns.length) {
      return data;
    }
    const groups = this.uniqueBy(
      data.map(
        row => {
          const result = new Group();
          result.level = level + 1;
          result.parent = parent;
          for (let i = 0; i <= level; i++) {
            result[groupByColumns[i]] = row[groupByColumns[i]];
          }
          return result;
        }
      ),
      JSON.stringify);

    const currentColumn = groupByColumns[level];
    let subGroups : any[] = [];
    groups.forEach(group => {
      const rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn]);
      group.totalCounts = rowsInGroup.length;
      const subGroup = this.getSublevel(rowsInGroup, level + 1, groupByColumns, group);
      subGroup.unshift(group);
      subGroups = subGroups.concat(subGroup);
    });
    return subGroups;
  }

  uniqueBy(a: any[], key: { (value: any, replacer?: ((this: any, key: string, value: any) => any) | undefined, space?: string | number | undefined): string; (value: any, replacer?: (string | number)[] | null | undefined, space?: string | number | undefined): string; (arg0: any): any; }) {
    const seen : any= {};
    return a.filter((item: any) => {
      const k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
  }

  isGroup(index: any, item: { level: boolean; }): boolean {
    // return item.level;
    if (item != undefined) {
      const isGroupVar = item.level;
      if (isGroupVar != undefined) {
        return item.level;
      } 
    }
    return false;
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  onContextMenuAction(item: Item) {
    let cellElement = item.cellElement;
    let day:String = cellElement.name;
    alert(`Click on Action 1 for ${day}`);
  }
} 

export interface Item {
  record: [];
  cellElement: FieldsElement;
}
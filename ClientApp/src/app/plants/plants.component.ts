import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html'
})

export class PlantsComponent {
  public plants: PlantModel[];

  statusText: string = "";
  warningText: string = "";
  plantsOnCooldown = new Object();
  plantsCurrentlyWatering = new Object();

  private myAPIurl = "http://localhost:52481/api/Plants";

  // http://localhost:52481/api/Plants
  constructor(private http: HttpClient, @Inject('BASE_URL') baseUrl: string) {
    http.get<PlantModel[]>(this.myAPIurl).subscribe(result => {
      this.plants = result;
      this.FixDates();
      this.SetWaterWarnings();
      this.statusText = "";
    }, error => console.error(error));
  }

  public RefreshPlantsData()
  {
    this.http.get<PlantModel[]>(this.myAPIurl).subscribe(result => {
      this.plants = result;
      this.FixDates();
      this.SetWaterWarnings();
      this.statusText = "";
    }, error => console.error(error));
  }


  // My dates from JSON stay as an unformatted string. Like "2020-02-20T14:24:38.88"
  // This function converts them to proper Date objects, so they can be compared.
  public FixDates()
  {
    if (this.plants == null || this.plants.length <= 0)
      return;

    for (var i = 0; i < this.plants.length; i++)
    {
      var d = new Date(this.plants[i].lastWatered);
      this.plants[i].lastWatered = d;
    }
  }

  // Staff need to be warned about plants that haven't been watered in over 6 hours.
  public SetWaterWarnings()
  {
    if (this.plants == null || this.plants.length <= 0)
      return;

    let sixHoursAgo = new Date(); // default value is current time
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    this.warningText = "";
    for (var i = 0; i < this.plants.length; i++)
    {
      if (this.plants[i].lastWatered < sixHoursAgo)
        this.warningText += this.plants[i].name + " needs watering! ";
    }
  }

  public WaterPlantClick(plantID)
  {
    // to prevent plants from being watered again within 30 seconds
    this.SetWaterCooldown(plantID, true);
    setTimeout(() => { this.SetWaterCooldown(plantID, false); }     , 30 * 1000)

    // to disable the cancel button after 10 seconds
    this.SetPlantCurrentlyWatering(plantID, true);
    setTimeout(() => { this.SetPlantCurrentlyWatering(plantID, false); }, 10 * 1000)


    // send water start event to the back end!
    this.http.get<PlantModel[]>('http://localhost:52481/api/WaterPlant/' + plantID).subscribe(result => {
      this.RefreshPlantsData();
    },
      error => {
        console.error(error)
        this.statusText = "something went horribly wrong!";
      });
  }

  public CancelWateringPlant(plantID: number) {
    this.SetPlantCurrentlyWatering(plantID, false);
    this.SetWaterCooldown(plantID, false);
  }

  public SetWaterCooldown(plantID: number, b: boolean){
    this.plantsOnCooldown[plantID] = b;
  }

  public CheckIfPlantOnCooldown(plantID: number) {
    if (this.plantsOnCooldown === null)
      return false;

    return this.plantsOnCooldown[plantID];
  }

  public SetPlantCurrentlyWatering(plantID: number, b: boolean) {
    this.plantsCurrentlyWatering[plantID] = b;
  }

  public CheckIfPlantIsCurrentlyWatering(plantID: number) {
    if (this.plantsCurrentlyWatering === null)
      return false;

    return this.plantsCurrentlyWatering[plantID];
  }

}

interface PlantModel {
  id: number;
  name: string;
  description: string;
  lastWatered: Date;
}

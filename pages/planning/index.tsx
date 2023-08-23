import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { Grid, Typography, Paper, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import dayjs from "dayjs";

async function fetchEvents(date: number, access_token: string) {
  date = new Date(new Date(date).setUTCHours(0, 0, 0, 0)).getTime();
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/planning?day=" + date.toString(),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve events");
  }

  const events = await response.json();
  for (const event of events) {
    if (event.type === "SPORTS_EXERCISE") {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL +
          "/sports-exercise/" +
          event.content.id,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve sports_exercise");
      }
      const sports_exercise = await response.json();
      event.sports_exercise = sports_exercise;
    } else {
		const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/meals/" + event.content.id, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${access_token}`,
		}});
		
		if (!response.ok) {
			throw new Error("Unable to retrieve meal");
		}
		const meal = await response.json();
		event.meal = meal;
	}
  }

  return events;
}

export default function Planning() {
  const session = useSession();
  const [selectedDate, setSelectedDate] = useState(Date());
  const color = "#F1895A";
  const theme = createTheme({
	components: {
		MuiIconButton: {
			styleOverrides: {
				sizeMedium: {
					color
				}
			}
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					color: color, '& fieldset': {
						borderColor: color,
					},
				}
			}
		},
		MuiInputLabel: {
			styleOverrides: {
				root: {
					color
				}
			}
		}
	}
  });

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEventData = async () => {
      if (session.data) {
        try {
          const data = await fetchEvents(
            Date.parse(selectedDate),
            session.data.user.access_token
          );
          setEvents(data);
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      }
    };

    fetchEventData();
  }, [selectedDate, session.data]);

  return (
    <Grid container spacing={2}>
      {/* Mettez en page les éléments du calendrier ici */}
      <Grid
        item
        xs={12}
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h5">Planning</Typography>
      </Grid>
      <Grid
        item
        xs={12}
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              defaultValue={dayjs()}
              label="Sélectionnez une date"
              value={dayjs(selectedDate)}
              onChange={(newDate) => setSelectedDate(newDate.toString())}
            />
          </LocalizationProvider>
        </ThemeProvider>

		<Button variant="contained" type='submit'>Ajouter un repas</Button>
		<Button variant="contained" type='submit'>Ajouter un exercice sportif</Button>
      </Grid>
      {/* Ajoutez d'autres éléments du calendrier ici */}
      <Grid item xs={12} sx={{ mx: "25%", mt: 6 }}>
		{events.length === 0 ? 
		<>
		   <Paper style={{ textAlign: "center", marginTop: "20px" }}>
            {/* Contenu du jour */}
            <Typography sx={{ pt: 1 }} variant="body1">Rien de prévu ce jour</Typography>
          </Paper>
		</>
		: null}
        {events.map((event, index) => (
          <Paper key={index} style={{ textAlign: "center", marginTop: "20px" }}>
            {/* Contenu du jour */}
            <Typography sx={{ pt: 1 }} variant="body1">{event.content.moment}h</Typography>
            <Typography sx={{ pt: 1 }} variant="body1">{event.type}</Typography>
            {event.type === "SPORTS_EXERCISE" ? (
              <>
                <Typography variant="body2">{event.sports_exercise.name}</Typography>
                <Typography variant="body2">{event.content.repetitions} répétitions.</Typography>
              </>
            ) : <>
				<Typography variant="body2">{event.meal.name}</Typography>
				<Typography variant="body2">{event.meal.period}</Typography>
		  	  </> 
		  }
          </Paper>
        ))}
      </Grid>
    </Grid>
  );
}
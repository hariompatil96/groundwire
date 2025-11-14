import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Popper,
  Select,
  TextField,
} from "@mui/material";
import { get } from "lodash";
import React, { useRef, useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { Country, State } from "country-state-city";
import { initialState, isEmpty } from "./common";
import { DateRangePicker } from "react-date-range";

const Filters = ({ platforms, formStates, campaingData, isPending }) => {
  const { campaignList, campaignLoading, handleCampaignChange } = campaingData;
  const {
    isValid,
    dirtyFields,
    errors,
    touchedFields,
    control,
    onSubmit,
    values,
    handleSubmit,
    setValue,
  } = formStates;
  const popperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [states, setStates] = useState([]);

  const handleInputClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US").format(date);
  };

  const handleCountryChange = (event, selectedCountries) => {
    setSelectedCountries(selectedCountries);

    if (selectedCountries.length > 0) {
      const allStates = selectedCountries
        .map((countryName) => {
          const country = Country.getAllCountries().find(
            (country) => country.name === countryName
          );
          return country ? State.getStatesOfCountry(country.isoCode) : [];
        })
        .flat();

      const uniqueStates = Array.from(
        new Set(allStates.map((state) => state.name))
      ).sort((a: any, b: any) => a.localeCompare(b));

      setStates(uniqueStates);
    } else {
      setStates([]);
      setSelectedStates([]);
    }
  };

  const countries = Country.getAllCountries()
    .map((country) => country.name)
    .sort((a, b) => {
      if (a === "United States") return -1;
      if (b === "United States") return 1;
      return a.localeCompare(b);
    });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target) &&
        !anchorEl?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [anchorEl]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container mt={3} px={2} gap={3} justifyContent={"center"}>
        <Grid item xs={12} sm={5}>
          <Controller
            name="platforms"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={platforms}
                getOptionLabel={(option) => option?.name || ""}
                isOptionEqualToValue={(option, value) =>
                  option.id === value?.id
                }
                onChange={(e, value) => {
                  field.onChange(value || null);
                  if (value?.id === "all") {
                    setValue("campaigns", [{ id: "all", name: "All" }], {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Platform"
                    variant="outlined"
                    fullWidth
                    error={!!errors?.platforms}
                    helperText={errors?.platforms?.message}
                    className="rs-autocomplete"
                  />
                )}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Controller
            name="campaigns"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                options={[
                  { id: "all", name: "All" },
                  ...get(campaignList, "result.data", []),
                ]}
                disableCloseOnSelect
                getOptionLabel={(option) => option?.name || ""}
                isOptionEqualToValue={(option, value) =>
                  option.id === value?.id
                }
                value={field.value || []}
                loading={campaignLoading}
                loadingText="Loading..."
                disabled={!values?.platforms?.id}
                onChange={(event, newValue, reason, details) =>
                  handleCampaignChange(event, newValue, reason, details)
                }
                sx={{
                  "& .MuiAutocomplete-inputRoot": {
                    flexWrap: "nowrap !important",
                  },
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      checked={
                        selected ||
                        field.value.some((val) => val.id === option.id)
                      }
                      sx={{
                        color: selected ? "#018594" : "default",
                        "&.Mui-checked": { color: "#018594" },
                      }}
                    />
                    {option.name}
                  </li>
                )}
                renderTags={(value, getTagProps) => {
                  if (value.length > 2) {
                    return [
                      <Chip
                        key="more"
                        label={`${value.length} selected`}
                        {...getTagProps({ index: -1 })}
                        title={value.map((val) => val.name).join(", ")}
                      />,
                    ];
                  }
                  return value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      {...getTagProps({ index })}
                    />
                  ));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Campaigns"
                    variant="outlined"
                    fullWidth
                    error={!!errors?.campaigns}
                    helperText={errors?.campaigns?.message}
                    className="rs-autocomplete"
                  />
                )}
                ListboxProps={{
                  style: {
                    maxHeight: 200,
                    overflow: "auto",
                  },
                }}
                className="rs-autocomplete"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={5} alignSelf={"flex-start"}>
          <FormControl fullWidth>
            <InputLabel id="dateType-label">Filter Type</InputLabel>
            <Controller
              name="filterType"
              control={control}
              defaultValue="dateRange"
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="dateType-label"
                  label="Filter Type"
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (e.target.value === "live") {
                      setValue("dateRange", initialState?.dateRange, {
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  <MenuItem value="dateRange">Date Range</MenuItem>
                  <MenuItem value="live">Live Data</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        {/* <Grid item xs={12} sm={5}>
                      <Autocomplete
                          multiple
                          options={countries}
                          value={selectedCountries}
                          onChange={handleCountryChange}
                          renderInput={(params) => (
                              <TextField {...params} label="Select Countries" variant="outlined" fullWidth />
                          )}
                          sx={{"& .MuiAutocomplete-inputRoot":{flexWrap:"nowrap !important"}}}
                          renderTags={(value, getTagProps) => {
                              return value.length > 2
                                  ? [
                                      <Chip
                                          key="more"
                                          label={`${value.length} selected`}
                                          {...getTagProps({ index: -1 })}
                                          title={value.join(', ')}
                                      />,
                                  ]
                                  : value.map((option, index) => (
                                      <Chip key={option} label={option} {...getTagProps({ index })} />
                                  ));
                          }}

                          renderOption={(props, option, { selected }) => (
                              <li {...props}>
                                  <Checkbox
                                      checked={selected}
                                      sx={{
                                          color: selected ? '#018594' : 'default',
                                          '&.Mui-checked': {
                                              color: '#018594',
                                          },
                                      }}
                                  />
                                  {option}
                              </li>
                          )}
                          ListboxProps={{
                              style: {
                                  maxHeight: 200,
                                  overflow: "auto",
                              },
                          }}
                          className='rs-autocomplete'
                          disableCloseOnSelect
                      />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                      <Autocomplete
                          multiple
                          options={states}
                          value={selectedStates}
                          onChange={(event, value) => setSelectedStates(value)}
                          renderInput={(params) => (
                              <TextField {...params} label="Select States" variant="outlined" fullWidth />
                          )}
                          sx={{"& .MuiAutocomplete-inputRoot":{flexWrap:"nowrap !important"}}}
                          renderTags={(value, getTagProps) => {
                              return value.length > 2
                                  ? [
                                      <Chip
                                          key="more"
                                          label={`${value.length} selected`}
                                          {...getTagProps({ index: -1 })}
                                          title={value.join(', ')}
                                      />,
                                  ]
                                  : value.map((option, index) => (
                                      <Chip key={option} label={option} {...getTagProps({ index })} />
                                  ));
                          }}
                          renderOption={(props, option, { selected }) => (
                              <li {...props}>
                                  <Checkbox
                                      checked={selected}
                                      sx={{
                                          color: selected ? '#018594' : 'default',
                                          '&.Mui-checked': {
                                              color: '#018594',
                                          },
                                      }}
                                  />
                                  {option}
                              </li>
                          )}
                          ListboxProps={{
                              style: {
                                  maxHeight: 200,
                                  overflow: "auto",
                              },
                          }}
                          className='rs-autocomplete'
                          disableCloseOnSelect
                      />
                  </Grid> */}
        {values?.filterType === "dateRange" ? (
          <Grid item xs={12} sm={5} alignSelf={"flex-start"}>
            <Controller
              name="dateRange"
              control={control}
              render={({ field }) => (
                <>
                  <TextField
                    value={`${formatDate(field.value[0].startDate)} to ${formatDate(field.value[0].endDate)}`}
                    onClick={handleInputClick}
                    label="Select Date Range"
                    fullWidth
                    inputProps={{
                      readOnly: true,
                    }}
                    error={!!errors?.dateRange}
                    helperText={errors?.dateRange?.message}
                  />
                  <Popper
                    open={open}
                    anchorEl={anchorEl}
                    placement="bottom-start"
                  >
                    <div ref={popperRef}>
                      <DateRangePicker
                        onChange={(item) => {
                          setValue("dateRange", [item.selection]);
                          field.onChange([item.selection]);
                        }}
                        showSelectionPreview
                        moveRangeOnFirstSelection={false}
                        months={2}
                        ranges={field.value}
                        direction="horizontal"
                        preventSnapRefocus
                        calendarFocus="backwards"
                        rangeColors={["#018594"]}
                      />
                    </div>
                  </Popper>
                </>
              )}
            />
          </Grid>
        ) : (
          <Grid item xs={12} sm={5}></Grid>
        )}
        <Grid item xs={12} textAlign={"center"}>
          <Button
            variant="contained"
            className="p-bg-color"
            type="submit"
            disabled={
              isEmpty(dirtyFields) || !isValid || isPending || !isEmpty(errors)
            }
          >
            {isPending ? <CircularProgress size={22} /> : "Apply Filters"}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default Filters;

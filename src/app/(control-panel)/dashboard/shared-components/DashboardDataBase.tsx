'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import "@/styles/date-range-picker.css"
import { useForm, } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useFetch, usePost } from '@/utils/hooks/useApi';
import { API_ROUTES } from '@/constants/api';
import { queryClient } from '@/app/App';
import { get } from 'lodash';
import { fetchAdAccountsAndStats, fetchAnalyticsData, initialState, schema } from "./common"
import ReportsList from './ReportsList';
import Filters from './Filters';
import LiveDataList from './LiveDataList';
import dayjs from "dayjs";
import { Refresh, WarningAmber } from '@mui/icons-material';


function DashboardDataBase() {

  const [platforms, setPlatforms] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [reports, setReports] = useState({});
  const [reportError, setReportError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveReports, setLiveReports] = useState([]);

  const {
    control,
    setValue,
    handleSubmit,
    watch,
    formState,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialState,
  });

  const { isValid, dirtyFields, errors, touchedFields } = formState;

  const values = watch();

  const { data: platformList, isLoading, error } = useFetch("platform-list", `${API_ROUTES["getPlatformList"]}`, {}, {
    enabled: true
  }, true);

  const { data: campaignList, isLoading: campaignLoading, error: campaignError } = useFetch(values?.platforms, `${API_ROUTES["getCampaignList"]}/${values?.platforms?.id}`, {}, {
    enabled: Boolean(values?.platforms?.id)
  }, true);

  const { mutate: applyFilterMutate, isPending, error: submitError } = usePost(API_ROUTES["getCampaign"], {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["get-data"] });
      if (data?.result?.status) {
        setReportError(false)
        setReports(data.result.totals)
      } else {
        setReportError(true)
      }
    },
    onError: (error) => {
      console.error(error)
      setReportError(true)
    },
  }, {}, true);

  const currentDate = dayjs().format("DD-MM-YYYY");

  const { data: { result: { data: liveDataList } = {} } = {}, isRefetching, isLoading: isLiveLoading, error: liveError, refetch } = useFetch(
    "live-campaign",
    `${API_ROUTES["getLiveData"]}/${currentDate}`,
    {
    },
    { enabled: false },
    true
  );

  useEffect(() => {
    if (platformList) {
      if (values?.filterType === "dateRange") {
        setPlatforms([{ id: "all", name: "All" }, ...get(platformList, "result.data", [])]);
      } else {
        setPlatforms([...get(platformList, "result.data", [])]);
      }
      dirtyFields.platforms = true;
    }
    if (campaignList) {
      setCampaigns(() => [{ id: "all", name: "All" }, ...get(campaignList, "result.data", [])]);
      const allCampaigns = [{ id: "all", name: "All" }, ...get(campaignList, "result.data", [])]?.map((campaign) => campaign);
      setValue("campaigns", allCampaigns, { shouldDirty: true, shouldValidate: true })
      dirtyFields.campaigns = true;
    }
  }, [platformList, campaignList])

  const handleCampaignChange = (event, selectedCampaigns) => {
    const isAllSelected = selectedCampaigns.some((campaign) => campaign.id === "all");
    const isCheckboxAllSelected = values?.campaigns?.some((campaign) => campaign.id === "all");
    const allAlreadySelected = selectedCampaigns?.length === campaigns?.length;
    if (!isAllSelected && isCheckboxAllSelected) {
      setValue("campaigns", []);
      return;
    }
    if (isAllSelected && !allAlreadySelected) {
      setValue("campaigns", campaigns, { shouldDirty: true, shouldValidate: true });
    } else if (isAllSelected && allAlreadySelected) {
      setValue("campaigns", []);
    } else {
      setValue("campaigns", selectedCampaigns);
    }
  };

  const onSubmit = async (data) => {
    if (values?.filterType === "dateRange") {
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };
      const campaignIds = data.campaigns?.length
        ? data.campaigns
          .filter((campaign) => campaign.id !== "all")
          .map((campaign) => Number(campaign.id))
        : "";
      const payload = {
        platformid: data.platforms?.id === "all" ? "" : data.platforms?.id,
        campaignid: campaignIds,
        startDate: formatDate(data.dateRange[0].startDate),
        endDate: formatDate(data.dateRange[0].endDate),
      };
      applyFilterMutate(payload);
    }
    else {
      if (values?.platforms?.name === "Facebook") {
        setLoading(true);
        try {
          const campaignIds = values?.campaigns?.length
            ? values.campaigns.filter((campaign) => campaign.id !== "all")
            : [];
          const data = await fetchAdAccountsAndStats(campaignIds);
          setLiveReports(data);
        } catch (error) {
          console.error("Error fetching Facebook data:", error);
        } finally {
          setLoading(false);
        }
      }
      else if (values?.platforms?.name === "GA4") {
        try {
          setLoading(true);
          const campaignIds = values?.campaigns?.length
            ? values.campaigns.filter((campaign) => campaign.id !== "all")
            : [];
          const data = await fetchAnalyticsData(campaignIds);
          setLiveReports(data);
        } catch (error) {
          console.error("Error fetching GA4 data:", error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    onSubmit(values);
  }, [])

  useEffect(() => {
    if (values?.filterType === "dateRange") {
      setPlatforms([{ id: "all", name: "All" }, ...get(platformList, "result.data", [])]);
      dirtyFields.platforms = true;
    } else if (values?.filterType === "live") {
      setPlatforms(() => [...get(platformList, "result.data", [])]);
      if (values?.platforms?.name === "All") {
        setValue("platforms", get(platformList, "result.data", [])[0])
      }
      dirtyFields.platforms = true;
    }
  }, [values?.filterType])

  useEffect(() => {
    setLiveReports([]);
  }, [values?.platforms])

  const hasData = liveDataList && Object.keys(liveDataList).length > 0;

  return (
    <div>
      <Filters
        formStates={{
          errors: formState.errors,
          isValid: formState.isValid,
          dirtyFields: formState.dirtyFields,
          onSubmit,
          control,
          values,
          handleSubmit,
          setValue
        }}
        campaingData={{
          campaignList,
          campaignLoading,
          handleCampaignChange
        }}
        platforms={platforms}
        isPending={values?.filterType !== "dateRange" ? loading : isPending}
      />

      {submitError || reportError ?
        <Box className="text-xl font-bold text-center mt-24 mx-4 h-[180px]">No data found for the specified dates.</Box>
        : values?.filterType === "dateRange" ? <ReportsList values={values} reports={reports} /> : <LiveDataList values={values} reports={liveReports} platforms={values?.platforms} />
      }
      <Divider />
      <div className="p-4 mt-4">
        {/* Header */}
        <div className="flex gap-8 items-center mb-4">
          <Typography variant="h6" className="font-semibold">Real-Time Data</Typography>
          <Button
            variant="contained"
            className="p-bg-color"
            onClick={() => refetch({ force: true })}
            disabled={isLiveLoading || isRefetching || hasData}
            startIcon={<Refresh />}
          >
            {isLiveLoading || isRefetching ? <CircularProgress size={22} color="inherit" /> : "Refresh"}
          </Button>
        </div>
        <Alert severity="warning" className='w-fit p-0 mb-2 bg-transparent'><strong>Note:</strong> Data updates are limited. Avoid frequent clicks to prevent API restrictions.</Alert>

        {isLiveLoading || isRefetching && (
          <div className="flex justify-center my-6">
            <CircularProgress />
          </div>
        )}

        {liveError && !isLiveLoading && !isRefetching && (
          <Typography className="text-red-500 text-center mt-4">
            Error fetching live data. Please try again.
          </Typography>
        )}

        {!isLiveLoading && !liveError && !hasData && !isRefetching && (
          <Typography className="text-gray-500 text-center mt-4">
            No live data available.
          </Typography>
        )}

        {!isLiveLoading && !liveError && hasData && !isRefetching && (
          <Box my={4}>
            <TableContainer component={Paper}>
              <Table
                sx={{
                  minWidth: 650,
                  border: "1px solid #ccc",
                  "& .MuiTableCell-root": { border: "1px solid #ccc" }
                }}
                aria-label="live data table"
              >
                <TableHead>
                  {/* <TableRow>
                    <TableCell className="font-bold bg-gray-100">Key Name</TableCell>
                    <TableCell className="font-bold bg-gray-100">Value</TableCell>
                  </TableRow> */}
                </TableHead>
                <TableBody>
                  {Object.entries(liveDataList)?.map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-bold">{key}</TableCell>
                      <TableCell>
                        {Array.isArray(value) ? (
                          <ul className="list-disc pl-4">
                            {value.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          value
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </div>
    </div>
  );
}

export default DashboardDataBase;